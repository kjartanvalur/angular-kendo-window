angular-kendo-window
====================

Angular Kendo Window

Here is a angular directive that helps create <a target='_blank' href='http://kendoui.com'>KendoUI</a> windows with its
own template and controller.

<b>This is highly influenced by <a target='_blank' href='http://angular-ui.github.io/bootstrap/#/modal'>UI Bootstrap modal directive</a>.</b>

<h1>Example</h1>
<pre>
 
   var windowInstance = $kWindow.open({
                        modal: true,
                        title: "Window title",
                        width: 400,
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
<a target='_blank' href='http://plnkr.co/edit/zb2Dy625Ld2PQdsi7RTE?p=preview'>Plunkr demo</a>
</h3>
