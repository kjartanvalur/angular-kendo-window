angular.module('kendo.window', [])
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
   
    .directive('kWindowFrame', [
    '$kModalStack', '$q', '$animate', '$injector',
    function ($modalStack, $q, $animate, $injector) {
        var $animateCss = null;
        if ($injector.has('$animateCss')) {
            $animateCss = $injector.get('$animateCss');
        }
        return {
            scope: {
                index: '@'
            },
            replace: true,
            transclude: true,
            templateUrl: function (tElement, tAttrs) {
                var windowInstance = $modalStack.getTop().value;
                return windowInstance.windowTemplateUrl || 'window.html';
            },
            link: function (scope, element, attrs) {
                scope.size = attrs.size;
                scope.close = function (evt) {
                    var modal = $modalStack.getTop();
                    if (modal && evt !== null && evt.target === evt.currentTarget) {
                        evt.preventDefault();
                        evt.stopPropagation();
                    }
                };
                var windowInstance = $modalStack.getTop().value;
                
                if(windowInstance.options.close !== undefined){
                    var closeFunction = windowInstance.options.close;
                    windowInstance.options.close = function(e){
                        closeFunction();
                        setTimeout(function(){
            				scope.myKendoWindow.destroy();
            			}, 1000);
                    }    
                }
                else{
                    windowInstance.options.close = function(e){
                        setTimeout(function(){
            				scope.myKendoWindow.destroy();
            			}, 1000);
                    }
                }
                scope.options = windowInstance.options;
                // moved from template to fix issue #2280
                element.on('click', scope.close);
                // This property is only added to the scope for the purpose of detecting when this directive is rendered.
                // We can detect that by using this property in the template associated with this directive and then use
                // {@link Attribute#$observe} on it. For more details please see {@link TableColumnResize}.
                scope.$isRendered = true;
                // Deferred object that will be resolved when this modal is render.
                var modalRenderDeferObj = $q.defer();
                // Observe function will be called on next digest cycle after compilation, ensuring that the DOM is ready.
                // In order to use this way of finding whether DOM is ready, we need to observe a scope property used in modal's template.
                attrs.$observe('modalRender', function (value) {
                    if (value == 'true') {
                        modalRenderDeferObj.resolve();
                    }
                });
                modalRenderDeferObj.promise.then(function () {
                    if(scope.options.position === undefined){
                      scope.myKendoWindow.center();
                    }
                    scope.myKendoWindow.open();
                    
                    scope.$on($modalStack.NOW_CLOSING_EVENT, function (e, setIsAsync) {
                        scope.done = setIsAsync();
                        scope.myKendoWindow.close();
                    });
                    var modal = $modalStack.getTop();
                    if (modal) {
                        // Notify {@link $modalStack} that modal is rendered.
                        $modalStack.modalRendered(modal.key);
                    }
                });
            }
        };
    }])
    .directive('kWindowTransclude', function () {
    return {
        link: function ($scope, $element, $attrs, controller, $transclude) {
            $transclude($scope.$parent, function (clone) {
                $element.empty();
                $element.append(clone);
            });
        }
    };
})
    .factory('$kModalStack', [
    '$animate', '$timeout', '$document', '$compile', '$rootScope',
    '$q',
    '$injector',
    '$$stackedMap',
    function ($animate, $timeout, $document, $compile, $rootScope, $q, $injector, $$stackedMap) {
        var $animateCss = null;
        if ($injector.has('$animateCss')) {
            $animateCss = $injector.get('$animateCss');
        }
        var openedWindows = $$stackedMap.createNew();
        
        var $modalStack = {
            NOW_CLOSING_EVENT: 'modal.stack.now-closing'
        };
        
        function removeModalWindow(windowInstance, elementToReceiveFocus) {
            var body = $document.find('body').eq(0);
            var modalWindow = openedWindows.get(windowInstance).value;
            //clean up the stack
            openedWindows.remove(windowInstance);
            removeAfterAnimate(modalWindow.modalDomEl, modalWindow.modalScope, function () {
                
            });
            //move focus to specified element if available, or else to body
            if (elementToReceiveFocus && elementToReceiveFocus.focus) {
                elementToReceiveFocus.focus();
            }
            else {
                body.focus();
            }
        }
        
        function removeAfterAnimate(domEl, scope, done) {
            var asyncDeferred;
            var asyncPromise = null;
            var setIsAsync = function () {
                if (!asyncDeferred) {
                    asyncDeferred = $q.defer();
                    asyncPromise = asyncDeferred.promise;
                }
                return function asyncDone() {
                    asyncDeferred.resolve();
                };
            };
            // NOW_CLOSING_EVENT broadcast.
            scope.$broadcast($modalStack.NOW_CLOSING_EVENT, setIsAsync);            
            
             setTimeout(function(){
                    domEl.parent().remove();
                    scope.$destroy();
                }, 1000);
        }
        $modalStack.open = function (windowInstance, modal) {
            var modalOpener = $document[0].activeElement;
            
            openedWindows.add(windowInstance, {
                deferred: modal.deferred,
                renderDeferred: modal.renderDeferred,
                openedDeferred: modal.openedDeferred,
                modalScope: modal.scope,
                options: modal.options,
                windowTemplateUrl: modal.windowTemplateUrl
            });
            
            var body = $document.find('body').eq(0);
            var angularDomEl = angular.element('<div k-window-frame="modal-window"></div>');
            angularDomEl.attr({
                'template-url': modal.windowTemplateUrl,
                'index': openedWindows.length() - 1,
                'animate': 'animate'
            }).html(modal.content);
            if (modal.animation) {
                angularDomEl.attr('modal-animation', 'true');
            }
            var modalDomEl = $compile(angularDomEl)(modal.scope);
            openedWindows.top().value.modalDomEl = modalDomEl;
            openedWindows.top().value.modalOpener = modalOpener;
            body.append(modalDomEl);
        };
        function broadcastClosing(modalWindow, resultOrReason, closing) {
            return !modalWindow.value.modalScope.$broadcast('modal.closing', resultOrReason, closing).defaultPrevented;
        }
        $modalStack.close = function (windowInstance, result) {
            var modalWindow = openedWindows.get(windowInstance);
            if (modalWindow && broadcastClosing(modalWindow, result, true)) {
                modalWindow.value.modalScope.$$kDestructionScheduled = true;
                modalWindow.value.deferred.resolve(result);
                removeModalWindow(windowInstance, modalWindow.value.modalOpener);
                return true;
            }
            return !modalWindow;
        };
        $modalStack.dismiss = function (windowInstance, reason) {
            var modalWindow = openedWindows.get(windowInstance);
            if (modalWindow && broadcastClosing(modalWindow, reason, false)) {
                modalWindow.value.modalScope.$$kDestructionScheduled = true;
                modalWindow.value.deferred.reject(reason);
                removeModalWindow(windowInstance, modalWindow.value.modalOpener);
                return true;
            }
            return !modalWindow;
        };
        $modalStack.dismissAll = function (reason) {
            var topModal = this.getTop();
            while (topModal && this.dismiss(topModal.key, reason)) {
                topModal = this.getTop();
            }
        };
        $modalStack.getTop = function () {
            return openedWindows.top();
        };
        $modalStack.modalRendered = function (windowInstance) {
            var modalWindow = openedWindows.get(windowInstance);
            if (modalWindow) {
                modalWindow.value.renderDeferred.resolve();
            }
        };
        return $modalStack;
    }])
    .provider('$kWindow', function () {
    var $modalProvider = {
        options: {
            animation: false,
            keyboard: true
        },
        $get: ['$injector', '$rootScope', '$q', '$templateRequest', '$controller', '$kModalStack',
            function ($injector, $rootScope, $q, $templateRequest, $controller, $modalStack) {
                var $modal = {};
                function getTemplatePromise(options) {
                    return options.template ? $q.when(options.template) :
                        $templateRequest(angular.isFunction(options.templateUrl) ? (options.templateUrl)() : options.templateUrl);
                }
                function getResolvePromises(resolves) {
                    var promisesArr = [];
                    angular.forEach(resolves, function (value) {
                        if (angular.isFunction(value) || angular.isArray(value)) {
                            promisesArr.push($q.when($injector.invoke(value)));
                        }
                        else if (angular.isString(value)) {
                            promisesArr.push($q.when($injector.get(value)));
                        }
                        else {
                            promisesArr.push($q.when(value));
                        }
                    });
                    return promisesArr;
                }
                var promiseChain = null;
                $modal.getPromiseChain = function () {
                    return promiseChain;
                };
                $modal.open = function (modalOptions) {
                    var modalResultDeferred = $q.defer();
                    var modalOpenedDeferred = $q.defer();
                    var modalRenderDeferred = $q.defer();
                    var modalScope = null;
                    //prepare an instance of a modal to be injected into controllers and returned to a caller
                    var windowInstance = {
                        id: $modalStack.length,
                        result: modalResultDeferred.promise,
                        opened: modalOpenedDeferred.promise,
                        rendered: modalRenderDeferred.promise,
                        close: function (result) {
                            return $modalStack.close(windowInstance, result);
                        },
                        dismiss: function (reason) {
                            return $modalStack.dismiss(windowInstance, reason);
                        }
                    };
                    //merge and clean up options
                    modalOptions = angular.extend({}, $modalProvider.options, modalOptions);
                    modalOptions.resolve = modalOptions.resolve || {};
                    //verify options
                    if (!modalOptions.template && !modalOptions.templateUrl) {
                        throw new Error('One of template or templateUrl options is required.');
                    }
                    var templateAndResolvePromise = $q.all([getTemplatePromise(modalOptions)].concat(getResolvePromises(modalOptions.resolve)));
                    function resolveWithTemplate() {
                        return templateAndResolvePromise;
                    }
                    // Wait for the resolution of the existing promise chain.
                    // Then switch to our own combined promise dependency (regardless of how the previous modal fared).
                    // Then add to $modalStack and resolve opened.
                    // Finally clean up the chain variable if no subsequent modal has overwritten it.
                    var samePromise;
                    samePromise = promiseChain = $q.all([promiseChain])
                        .then(resolveWithTemplate, resolveWithTemplate)
                        .then(function resolveSuccess(tplAndVars) {
                        modalScope = (modalOptions.scope || $rootScope).$new();
                        modalScope.$close = windowInstance.close;
                        modalScope.$dismiss = windowInstance.dismiss;
                        modalScope.$on('$destroy', function () {
                            if (!modalScope.$$kDestructionScheduled) {
                                modalScope.$dismiss('$kUnscheduledDestruction');
                            }
                        });
                        var ctrlInstance, ctrlLocals = {};
                        var resolveIter = 1;
                        //controllers
                        if (modalOptions.controller) {
                            ctrlLocals.$scope = modalScope;
                            ctrlLocals.$windowInstance = windowInstance;
                            angular.forEach(modalOptions.resolve, function (value, key) {
                                ctrlLocals[key] = tplAndVars[resolveIter++];
                            });
                            ctrlInstance = $controller(modalOptions.controller, ctrlLocals);
                            if (modalOptions.controllerAs) {
                                if (modalOptions.bindToController) {
                                    angular.extend(ctrlInstance, modalScope);
                                }
                                modalScope[modalOptions.controllerAs] = ctrlInstance;
                            }
                        }
                        $modalStack.open(windowInstance, {
                            scope: modalScope,
                            deferred: modalResultDeferred,
                            openedDeferred: modalOpenedDeferred,
                            renderDeferred: modalRenderDeferred,
                            content: tplAndVars[0],
                            options: modalOptions.options === undefined ? {} : modalOptions.options,
                            windowTemplateUrl: modalOptions.windowTemplateUrl
                        });
                    }, function resolveError(reason) {
                        modalOpenedDeferred.reject(reason);
                        modalResultDeferred.reject(reason);
                    })
                        .finally(function () {
                        if (promiseChain === samePromise) {
                            promiseChain = null;
                        }
                    });
                    return windowInstance;
                };
                return $modal;
            }
        ]
    };
    return $modalProvider;
});
