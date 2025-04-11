/**
 * @ngDoc directive
 * @name ng.directive:quickbook
 *
 * @description
 * A directive to aid in paging large datasets
 * while requiring a small amount of page
 * information.
 *
 * @element EA
 *
 */
'use strict';

angular.module('POOLAGENCY')

.directive('connectToQuickbooks', function($window){
  return {
    restrict: 'E',
    template: "<ipp:connectToIntuit></ipp:connectToIntuit>",
    link: function(scope) {
      var intuitScriptLoaded = function(){
        return $window.intuit
          && $window.intuit.ipp
          && $window.intuit.ipp.anywhere
          && $window.intuit.ipp.anywhere.setup;
      };

      if (intuitScriptLoaded()) {
        // Hack to get the button to reload when this directive is shown
        // for the second time, since the QB connect button assumes that
        // the button is not rendered dynamically
        $window.intuit.ipp.anywhere.init();
      } else {
        var script = $window.document.createElement("script");
        script.type = "text/javascript";
        script.src = "//js.appcenter.intuit.com/Content/IA/intuit.ipp.anywhere.js";
        $window.document.body.appendChild(script);
      }

      scope.$watch(
        intuitScriptLoaded,
        function(newValue, oldValue) {
          if(intuitScriptLoaded()) {
            $window.intuit.ipp.anywhere.setup({
              grantUrl: '/'
            });
          }
        }
      );
    }
  }
});
