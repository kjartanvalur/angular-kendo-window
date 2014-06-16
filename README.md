angular-kendo-window
====================

Angular Kendo Window

Here is a angular directive that helps create KendoUI windows with its
own template and controller.

This is highly influenced by UI Bootstrap modal feature.

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
<a target='_blank' href='http://plnkr.co/edit/0AgWTigMDEVZEYcCSktq?p=preview'>Plunkr demo</a>
</h3>
