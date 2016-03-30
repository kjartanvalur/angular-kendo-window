<h1>angular-kendo-window</h1>

Angular Kendo Window

Angular directive to dynamically create <a target='_blank' href='http://kendoui.com'>Kendo UI</a> windows with a separate template and controller.

<b>This is highly influenced by <a target='_blank' href='http://angular-ui.github.io/bootstrap/#/modal'>UI Bootstrap modal directive</a>.</b>
<h3>Please vote for this to be officially supported in <a target='_blank' href='http://kendoui-feedback.telerik.com/forums/127393-telerik-kendo-ui-feedback/suggestions/11299620-angular-and-kendo-window'>Kendo UserVoice</a></h3>

<h1>Documentation</h1>
<h4><a target='_blank' href='http://docs.telerik.com/kendo-ui/AngularJS/how-to/window-service'>Telerik documentation for angular-kendo-window</a></h4>
<h4><a target='_blank' href='http://docs.telerik.com/kendo-ui/api/javascript/ui/window'>Telerik documentation for kendo.ui.window</a></h4>


<h1>Example</h1>
<pre>
 
   var windowInstance = $kWindow.open({
                       options:{
                         modal: true,
                         title: "Window title",
                         height: 150,
                         width: 400,
                         visible: false
                       },
                        templateUrl: 'modal1.html',
                        controller: 'modalController',
                        resolve: {
                            parameter1: function () {
                                return "Test...";
                            }
                        }
                    });
                    windowInstance.result.then(function (result) {
                        // Here you can get result from the window
                    });
 
</pre>
<h1>Demo</h1>

<h3>
<a target='_blank' href='http://plnkr.co/edit/DFvDwqYeFcZJlFTriPwj?p=preview'>Plunkr demo</a>
</h3>

<h1>Installation</h1>
<h3>Bower</h3>
<pre>bower install angular-kendo-window</pre>
