angular.module('kendo.window', [])

/**
 * A helper, internal data structure that acts as a map but also allows getting / removing
 * elements in the LIFO order
 */
  .factory('$$stackedMap', function () {
      return {
          createNew: function () {
              var stack = [];

              return {
                  add: function (key, value) {
                      stack.push({
                          key: key,
                          value: value
                      });
                  },
                  get: function (key) {
                      for (var i = 0; i < stack.length; i++) {
                          if (key == stack[i].key) {
                              return stack[i];
                          }
                      }
                  },
                  keys: function () {
                      var keys = [];
                      for (var i = 0; i < stack.length; i++) {
                          keys.push(stack[i].key);
                      }
                      return keys;
                  },
                  top: function () {
                      return stack[stack.length - 1];
                  },
                  remove: function (key) {
                      var idx = -1;
                      for (var i = 0; i < stack.length; i++) {
                          if (key == stack[i].key) {
                              idx = i;
                              break;
                          }
                      }
                      return stack.splice(idx, 1)[0];
                  },
                  removeTop: function () {
                      return stack.splice(stack.length - 1, 1)[0];
                  },
                  length: function () {
                      return stack.length;
                  }
              };
          }
      };
  })

  .factory('$windowStack', ['$document', '$compile', '$rootScope', '$$stackedMap',
    function ($document, $compile, $rootScope, $$stackedMap) {


        var body = $document.find('body').eq(0);
        var openedWindows = $$stackedMap.createNew();
        var $windowStack = {};




        function removeWindow(windowInstance) {

            var kendoWindow = openedWindows.get(windowInstance).value;

            $(kendoWindow.windowDomEl).data("kendoWindow").destroy();

            //clean up the stack
            openedWindows.remove(windowInstance);

            //remove window DOM element
            kendoWindow.windowDomEl.remove();


            //destroy scope
            kendoWindow.windowScope.$destroy();



        }



        $windowStack.open = function (windowInstance, kWindow) {

            openedWindows.add(windowInstance, {
                deferred: kWindow.deferred,
                windowScope: kWindow.scope,
                keyboard: kWindow.keyboard
            });


            var angularDomEl = angular.element('<div id="'+ windowInstance.id +'"></div>');
            angularDomEl.attr('window-class', kWindow.windowClass);
            angularDomEl.attr('index', openedWindows.length() - 1);
            angularDomEl.html(kWindow.content);

            var windowDomEl = $compile(angularDomEl)(kWindow.scope);
            openedWindows.top().value.windowDomEl = windowDomEl;
            body.append(windowDomEl);

        };

        $windowStack.close = function (windowInstance, result) {
            var kendoWindow = openedWindows.get(windowInstance).value;
            if (kendoWindow) {
                kendoWindow.deferred.resolve(result);
                removeWindow(windowInstance);
            }
        };

        $windowStack.dismiss = function (windowInstance, reason) {
            var kendoWindow = openedWindows.get(windowInstance).value;
            if (kendoWindow) {
                kendoWindow.deferred.reject(reason);
                removeWindow(windowInstance);
            }
        };

        $windowStack.getTop = function () {
            return openedWindows.top();
        };

        $windowStack.length = function () {
            return openedWindows.length();
        }

        return $windowStack;
    }])

  .provider('$kWindow', function () {

      var $windowProvider = {
          options: {
              keyboard: true
          },
          $get: ['$injector', '$rootScope', '$q', '$http', '$templateCache', '$controller', '$windowStack',
            function ($injector, $rootScope, $q, $http, $templateCache, $controller, $windowStack) {

                var $kWindow = {};

                function getTemplatePromise(options) {
                    return options.template ? $q.when(options.template) :
                      $http.get(options.templateUrl, { cache: $templateCache }).then(function (result) {
                          return result.data;
                      });
                }

                function getResolvePromises(resolves) {
                    var promisesArr = [];
                    angular.forEach(resolves, function (value, key) {
                        if (angular.isFunction(value) || angular.isArray(value)) {
                            promisesArr.push($q.when($injector.invoke(value)));
                        }
                    });
                    return promisesArr;
                }

                $kWindow.open = function (windowOptions) {

                    var windowResultDeferred = $q.defer();
                    var windowOpenedDeferred = $q.defer();

                    //prepare an instance of a window to be injected into controllers and returned to a caller
                    var windowInstance = {
                        id: "kWindow" + $windowStack.length(),
                        result: windowResultDeferred.promise,
                        opened: windowOpenedDeferred.promise,
                        close: function (result) {
                            $windowStack.close(windowInstance, result);
                        },
                        dismiss: function (reason) {
                            $windowStack.dismiss(windowInstance, reason);
                        }
                    };

                    //merge and clean up options
                    windowOptions = angular.extend({}, $windowProvider.options, windowOptions);
                    windowOptions.resolve = windowOptions.resolve || {};

                    //verify options
                    if (!windowOptions.template && !windowOptions.templateUrl) {
                        throw new Error('One of template or templateUrl options is required.');
                    }

                    var templateAndResolvePromise =
                      $q.all([getTemplatePromise(windowOptions)].concat(getResolvePromises(windowOptions.resolve)));


                   
                    templateAndResolvePromise.then(function resolveSuccess(tplAndVars) {


                        var kendoWindow = undefined;
                        var windowScope = (windowOptions.scope || $rootScope).$new();
                        windowScope.$close = windowInstance.close;
                        windowScope.$dismiss = windowInstance.dismiss;

                        var ctrlInstance, ctrlLocals = {};
                        var resolveIter = 1;

                        //controllers
                        if (windowOptions.controller) {
                            ctrlLocals.$scope = windowScope;
                            ctrlLocals.$windowInstance = windowInstance;
                            angular.forEach(windowOptions.resolve, function (value, key) {
                                ctrlLocals[key] = tplAndVars[resolveIter++];
                            });

                            ctrlInstance = $controller(windowOptions.controller, ctrlLocals);
                        }


                        $windowStack.open(windowInstance, {
                            scope: windowScope,
                            deferred: windowResultDeferred,
                            content: tplAndVars[0],
                            keyboard: windowOptions.keyboard,
                            windowClass: windowOptions.windowClass
                        });



                    }, function resolveError(reason) {
                        windowResultDeferred.reject(reason);
                    });



                    templateAndResolvePromise.then(function () {

                        var opts = {
                            title: windowOptions.title,
                            modal: true,
                            actions: ["Close"],
                            visible: false,
                            close: function (e) {
                                windowInstance.close(null);
                            }
                        };

                        if (windowOptions.width) {
                            opts.width = windowOptions.width;
                        }

                        if (windowOptions.height) {
                            opts.height = windowOptions.height;
                        }
                        if (windowOptions.modal != null) {
                            opts.modal = windowOptions.modal;
                        }
                        if (windowOptions.actions) {
                            opts.actions = windowOptions.actions;
                        }
                        if (windowOptions.noMaxHeight == null || windowOptions.noMaxHeight == false) {

                            if (windowOptions.maxHeight) {
                                opts.maxHeight = windowOptions.maxHeight;
                            }
                            else {
                                opts.maxHeight = 600;
                                opts.resizable = false;
                            }
                        }
                        
                         
                        
                        var wnd = $("#"+ windowInstance.id).kendoWindow(opts);
                        var dialog = $("#" + windowInstance.id).data("kendoWindow");
                        dialog.open().center();

                        windowOpenedDeferred.resolve(true);

                    }, function () {
                        windowOpenedDeferred.reject(false);
                    });

                    return windowInstance;
                };

                return $kWindow;
            }]
      };

      return $windowProvider;
  });
