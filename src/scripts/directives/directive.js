"use strict";
/* Application */
/*
 * Angular js Directive starts here
 * angular directive function
 */

angular
  .module("POOLAGENCY")
  .filter('highlight', function(){
      return function(item, searchKey){
        if (searchKey != '' && searchKey.includes('*')) {
          searchKey = searchKey.replace('*', '')
        }
        if (searchKey != '' && searchKey.includes('(')) {
          searchKey = searchKey.replace('(', '')
        }
        if (searchKey != '' && searchKey.includes(')')) {
          searchKey = searchKey.replace(')', '')
        }
        if (searchKey != '' && searchKey.includes('[')) {
          searchKey = searchKey.replace('[', '')
        }
        if (searchKey != '' && searchKey.includes(']')) {
          searchKey = searchKey.replace(']', '')
        }
        var searchString = ''
        if(item){
            item = item.toString();
            searchString = item.slice(item.search(new RegExp(searchKey,'gi')), item.search(new RegExp(searchKey,'gi'))+searchKey.length)
        }
        return item.replace(new RegExp(searchKey,'gi'), '<span>'+searchString+'</span>')
      }
  })
  .filter('capitalize', function() {
    return function(input) {
      return (angular.isString(input) && input.length > 0) ? angular.uppercase(input) : input;
    }
})

 .filter('htmlToPlaintext', function() {
   return function(text) {
     var regex = /(<([^>]+)>)/ig;
     var result = '';
     if(text){
        result = text.replace(regex, " ");
     }     
     return result;//angular.element(text).text();
   }
 })
 .filter('addressFormat', function() {
  return function(text) {
    if( !text.length ){
      return;
    }else{
      var textArray = text.toString().split('|');
      var zipcode = textArray.pop();
      var address = textArray.join(', ');
      return address+" "+zipcode;
    } 
    
  }
})
.filter('convertToArrayByComma', function() {
  return function(text) {
    if( !text.length ) return;
    return text.split(',');
  }
}).directive("decimals", function ($filter) {
    return {
        restrict: "A", // Only usable as an attribute of another HTML element
        require: "?ngModel",
        scope: {
            decimals: "@",
            decimalPoint: "@"
        },
        link: function (scope, element, attr, ngModel) {
            var decimalCount = parseInt(scope.decimals) || 2;
            var decimalPoint = scope.decimalPoint || ".";
            // Run when the model is first rendered and when the model is changed from code
            // replace comma with dots
            var _val = element.val().replace(",", ".");
            // remove extra dots
            _val = _val.replace(/(\d*.)(.*)/, '$1') + _val.replace(/(\d*.)(.*)/, '$2').replace(/\./g,'');
            // convert to Number
            _val = Number(_val);
            var _isInt = _val % 1 === 0 || false;
            var _dontFix = element[0].getAttribute("data-dont-fix-if-int") === 'true' || false; 
            ngModel.$render = function() {
             
                if (ngModel.$modelValue != null && ngModel.$modelValue >= 0) {
                    if (typeof decimalCount === "number") {
                       if (_isInt && _dontFix) {
                          element.val(ngModel.$modelValue);
                       } else if (!_isInt && _dontFix) {
                        var _x = _val.toString();  // convert to string for array
                        _x = _x.split('.'); // convert to array
                        _x = _x[0] + '.' + _x[1].substring(0, 2); // remove extra decimals
                        _x = Number(_x); // convert to number
                        element.val(_x);
                      } else {
                         element.val(parseFloat(ngModel.$modelValue).toFixed(decimalCount));
                       }
                    } else {
                        element.val(ngModel.$modelValue);
                    }
                }
            }

            // Run when the view value changes - after each keypress
            // The returned value is then written to the model
            ngModel.$parsers.unshift(function(newValue) {              
              if(newValue){
                if (typeof decimalCount === "number") {
                    var floatValue = parseFloat(newValue.replace(",", "."));
                    if (decimalCount === 0) {
                        return parseInt(floatValue);
                    }
                    return parseFloat(floatValue.toFixed(decimalCount));
                }
                
                return parseFloat(newValue.replace(",", "."));
              }
            });

            // Formats the displayed value when the input field loses focus
            element.on("change", function(e) {
                // replace comma with dots
                var _val = element.val().replace(",", ".");
                // remove extra dots
                _val = _val.replace(/(\d*.)(.*)/, '$1') + _val.replace(/(\d*.)(.*)/, '$2').replace(/\./g,'');
                // convert to Number
                _val = Number(_val);
                var _isInt = _val % 1 === 0 || false;
                var _dontFix = element[0].getAttribute("data-dont-fix-if-int") === 'true' || false;                
                var floatValue = parseFloat(element.val().replace(",", "."));
                if (!isNaN(floatValue) && typeof decimalCount === "number") {
                    if (decimalCount === 0) {
                        element.val(parseInt(floatValue));
                    } else if (_isInt && _dontFix) {
                        element.val(parseInt(floatValue));
                    } else if (!_isInt && _dontFix) {
                        var _x = _val.toString();  // convert to string for array
                        _x = _x.split('.'); // convert to array
                        _x = _x[0] + '.' + _x[1].substring(0, 2); // remove extra decimals
                        _x = Number(_x); // convert to number
                        element.val(_x);
                    } else {
                        var strValue = floatValue.toFixed(decimalCount);
                        element.val(strValue.replace(".", decimalPoint));
                    }
                }
            });
        }
    }
})
  .directive("ngFileModel", [
    "$parse",
    function($parse) {
      return {
        restrict: "A",
        link: function(scope, element, attrs) {
          var model = $parse(attrs.ngFileModel);
          var isMultiple = attrs.multiple;
          var modelSetter = model.assign;
          element.bind("change", function() {
            var values = [];

            angular.forEach(element[0].files, function(item) {

              var value = {
                // File Name
                name: item.name,
                //File Size
                size: item.size,
                //File URL to view
                url: URL.createObjectURL(item),
                // File Input Value
                _file: item
              };
              values.push(value);
            });
            scope.$apply(function() {

                if (isMultiple) {
                  modelSetter(scope, values);
                } else {
                  modelSetter(scope, values[0]);
                }
            });
          });
        }
      };
    }
  ])
  .directive("fileModel", [
    "$parse",
    function($parse) {
      return {
        restrict: "A",
        link: function(scope, element, attrs) {
          var isMultiple = attrs.multiple;
          element.bind("change", function() {

           $parse(attrs.fileModel).assign(scope, element[0].files);
            scope.$apply();

          });
        }
      };
    }
  ])

  // set confirm password validation
  .directive("wjValidationError", function() {
    return {
      require: "ngModel",
      link: function(scope, elm, attrs, ctl) {
        scope.$watch(attrs["wjValidationError"], function(errorMsg) {
          elm[0].setCustomValidity(errorMsg);
          ctl.$setValidity("wjValidationError", errorMsg ? false : true);
        });
      }
    };
  })
  .directive("onFinishRender", function($timeout) {
    return {
      restrict: "A",
      link: function(scope, element, attr) {
        if (scope.$last === true) {
          $timeout(function() {
            scope.searchOnMap(attr, 0);
          });
        }
      }
    };
  })
  .directive("windowExit", function($window) {
    return {
      restrict: "AE",
      link: function(element, attrs) {
        var myEvent = $window.attachEvent || $window.addEventListener,
          chkevent = $window.attachEvent ? "onbeforeunload" : "beforeunload"; /// make IE7, IE8 compatable

        myEvent(chkevent, function(e) {
          // For >=IE7, Chrome, Firefox
          var confirmationMessage = " "; // a space
          (e || $window.event).returnValue =
            "Are you sure that you'd like to close the browser?";
          return confirmationMessage;
        });
      }
    };
  })
  .directive("onlyNum", function() {
    return function(scope, element, attrs) {
      var keyCode = [
        8,
        9,
        37,
        39,
        48,
        49,
        50,
        51,
        52,
        53,
        54,
        55,
        56,
        57,
        96,
        97,
        98,
        99,
        100,
        101,
        102,
        103,
        104,
        105,
        110,
        46
      ];
      element.bind("keydown", function(event) {


        if ($.inArray(event.which, keyCode) == -1) {
          scope.$apply(function() {
            scope.$eval(attrs.onlyNum);
            event.preventDefault();
          });
          event.preventDefault();
        }
      });
    };
  })
  .directive("loading", function() {
    return {
      restrict: "E",
      replace: true,
      template:
        '<div id="loader"><img src="images/loading.gif" width="100%" /></div>',
      link: function(scope, element, attr) {
        scope.$watch("loading", function(val) {
          if (val) $(element).show();
          else $(element).hide();
        });
      }
    };
  })
  .directive("nksOnlyNumber", function() {
    return {
      restrict: "EA",
      require: "ngModel",
      link: function(scope, element, attrs, ngModel) {
        scope.$watch(attrs.ngModel, function(newValue, oldValue) {
          var spiltArray = String(newValue).split("");
          if (attrs.allowNegative == "false") {
            if (spiltArray[0] == "-") {
              newValue = newValue.replace("-", "");
              ngModel.$setViewValue(newValue);
              ngModel.$render();
            }
          }
          if (attrs.allowDecimal == "false") {
            newValue = parseInt(newValue);
            ngModel.$setViewValue(newValue);
            ngModel.$render();
          }
          if (attrs.allowDecimal != "false") {
            if (attrs.decimalUpto) {
              var n = String(newValue).split(".");
              if (n[1]) {
                var n2 = n[1].slice(0, attrs.decimalUpto);
                newValue = [n[0], n2].join(".");
                ngModel.$setViewValue(newValue);
                ngModel.$render();
              }
            }
          }
          if (spiltArray.length === 0) return;
          if (
            spiltArray.length === 1 &&
            (spiltArray[0] == "-" || spiltArray[0] === ".")
          )
            return;
          if (spiltArray.length === 2 && newValue === "-.") return;
          /*Check it is number or not.*/
          if (isNaN(newValue)) {
            ngModel.$setViewValue(oldValue);
            ngModel.$render();
          }
        });
      }
    };
  })
  .directive("ngEnter", function() {
    return function(scope, element, attrs) {
      element.bind("keydown keypress", function(event) {
        if (event.which === 13) {
          scope.$apply(function() {
            scope.$eval(attrs.ngEnter, {
              event: event
            });
          });
          event.preventDefault();
        }
      });
    };
  })
  .directive("tmpl", function($compile) {
    var directive = {};
    directive.restrict = "A";
    directive.templateUrl = "app/view/_child.html";
    directive.transclude = true;
    directive.link = function(scope, element, attrs) {};
    return {};
  })

  .directive("customOnChange", function() {
    return {
      restrict: "A",
      link: function(scope, element, attrs) {
        var onChangeHandler = scope.$eval(attrs.customOnChange);

        element.bind("change", onChangeHandler);
      }
    };
  })

  .directive("formatAddress", function() {
    return {
      restrict: "E",
      transclude: "true",
      link: function(scope, element, attr) {
        var separator = attr.format && attr.format == "single" ? ", " : "<br/>";
        var addressArr = attr.address.split(" ");
        var address1 = addressArr.slice(0, -3);
        var address2 = addressArr.slice(-3);
        element.append(
          "<span>" +
            address1
              .join(" ")
              .trim()
              .replace(",,", ",") +
            separator +
            address2
              .join(" ")
              .trim()
              .replace(" ", ", ")
              .replace(",,", ",") +
            "</span>"
        );
        separator = "";
      }
    };
  })

  .directive("phoneNumber", function() {
    return {
      restrict: "E",
      transclude: "true",
      replace: "true",
      link: function(scope, element, attr) {
        attr.$observe(
          "number",
          function(data) {
            var s2 = ("" + attr.number).replace(/\D/g, "");
            var result = '';          
            if(s2 != ''){
              var num = s2; //long number
              var str = num.toString(); //convert number to string             
              result = str.substring(0,11) //cut six first character              
            } else {
              result = '';
            }            
            var m = result.match(/^(\d{3})(\d{3})(\d{5})$/);           
            if(!m){
              m = s2.match(/^(\d{3})(\d{3})(\d{4})$/);
            }
            if (!m) {
              m = s2.match(/^(\d{3})(\d{3})(\d{3})$/);
            }
            m = !m ? null : m[1] + "-" + m[2] + "-" + m[3];
            element.html(m);
          },
          true
        );
      }
    };
  })

  .directive("success", function() {
    return {
      restrict: "E",
      transclude: "true",
      link: function(scope, element, attr) {
        element.append(
          '<div class="isa_success"><!--i class="fa fa-check"></i-->' +
            attr.message +
            "</div>"
        );
      }
    };
  })

  .directive("error", function() {
    return {
      restrict: "E",
      transclude: "true",
      link: function(scope, element, attr) {
        element.append(
          '<div class="isa_error"><!--i class="fa fa-times-circle"></i-->' +
            attr.message +
            "</div>"
        );
      }
    };
  })

  /*
 * Checks every $digest for height changes
 */
  .directive("emHeightSource", function() {
    return {
      link: function(scope, elem) {
        scope.$watch(function() {
          document.querySelector(".sidebar").style.minHeight = elem.height() + "px";
        });
      }
    };
  })
  .directive("phoneInput", function($filter, $browser) {
    return {
      require: "ngModel",
      link: function($scope, $element, $attrs, ngModelCtrl) {
        var listener = function() {
          var value = $element.val().replace(/[^0-9]/g, "");
          $element.val($filter("tel")(value, false));
        };

        // This runs when we update the text field
        ngModelCtrl.$parsers.push(function(viewValue) {
          return viewValue.replace(/[^0-9]/g, "").slice(0, 10);
        });

        // This runs when the model gets updated on the scope directly and keeps our view in sync
        ngModelCtrl.$render = function() {
          $element.val($filter("tel")(ngModelCtrl.$viewValue, false));
        };

        $element.bind("change", listener);
        $element.bind("keydown", function(event) {
          var key = event.keyCode;
          // If the keys include the CTRL, SHIFT, ALT, or META keys, or the arrow keys, do nothing.
          // This lets us support copy and paste too
          if (key == 91 || (15 < key && key < 19) || (37 <= key && key <= 40)) {
            return;
          }
          $browser.defer(listener); // Have to do this or changes don't get picked up properly
        });

        $element.bind("paste cut", function() {
          $browser.defer(listener);
        });
      }
    };
  }).directive("customPhoneInput", function($filter, $browser) {
    return {
      require: "ngModel",
      link: function($scope, $element, $attrs, ngModelCtrl) {
        var clistener = function() {
          
          var value = $element.val().replace(/[^0-9]/g, "");
          if(value){
            $element.val($filter("tel")(value, false));
           }else{
            return true;
          }
          
        };

        // This runs when we update the text field
        ngModelCtrl.$parsers.push(function(viewValue) {
          return viewValue.replace(/[^0-9]/g, "").slice(0, 10);
        });

        // This runs when the model gets updated on the scope directly and keeps our view in sync
        ngModelCtrl.$render = function() {
          $element.val($filter("tel")(ngModelCtrl.$viewValue, false));
        };

        $element.bind("change", clistener);
        $element.bind("keydown", function(event) {
          var key = event.keyCode;
          // If the keys include the CTRL, SHIFT, ALT, or META keys, or the arrow keys, do nothing.
          // This lets us support copy and paste too
          if (key == 91 || (15 < key && key < 19) || (37 <= key && key <= 40)) {
            return;
          }
          $browser.defer(clistener); // Have to do this or changes don't get picked up properly
        });

        $element.bind("paste cut", function() {
          $browser.defer(clistener);
        });
      }
    };
  })
  .filter("tel", function() {
    return function(tel) {

      if (!tel) {
        return "";
      }

      var value = tel
        .toString()
        .trim()
        .replace(/^\+/, "");

      if (value.match(/[^0-9]/)) {
        return tel;
      }

      var country, city, number;

      switch (value.length) {
        case 1:
        case 2:
        case 3:
          city = value;
          break;

        default:
          city = value.slice(0, 3);
          number = value.slice(3);
      }

      if (number) {
        if (number.length > 3) {
          number = number.slice(0, 3) + "-" + number.slice(3, 7);
        } else {
          number = number;
        }

        return ("" + city + "-" + number).trim();
      } else {
        return "" + city;
      }
    };
  }).filter('truncate', function () {
    return function (value, wordwise, max, tail) {
        if (!value) return '';
        max = parseInt(max, 10);
        if (!max) return value;
        if (value.length <= max) return value;

        value = value.substr(0, max);
        if (wordwise) {
            var lastspace = value.lastIndexOf(' ');
            if (lastspace != -1) {
                value = value.substr(0, lastspace);
            }
        }
        return value + (tail || ' …');
    };
  })
  .directive("escKey", function() {
    return function(scope, element, attrs) {
      element.bind("keydown keypress", function(event) {
        if (event.which === 27) {
          // 27 = esc key
          scope.$apply(function() {
            scope.$eval(attrs.escKey);
          });

          event.preventDefault();
        }
      });
    };
  })
  .directive("creditCardType", function() {
    var directive = {
      require: "ngModel",
      link: function(scope, elm, attrs, ctrl) {
        ctrl.$parsers.unshift(function(value) {
          scope.ccinfo.type = /^(5[1-5][0-9]{14}|2(22[1-9][0-9]{12}|2[3-9][0-9]{13}|[3-6][0-9]{14}|7[0-1][0-9]{13}|720[0-9]{12}))/.test(value)
            ? "mastercard"
            : /^4/.test(value)
              ? "visa"
              : /^3[47]/.test(value)
                ? "amex"
                : /^6011|65|64[4-9]|622(1(2[6-9]|[3-9]\d)|[2-8]\d{2}|9([01]\d|2[0-5]))/.test(
                    value
                  )
                  ? "discover"
                    : /^(3(?:088|096|112|158|337|5(?:2[89]|[3-8][0-9]))\d{12})/.test(value)
                    ? "JCB"
                      : /^3(?:0[0-5]|[68][0-9])[0-9]{11}/.test(value)
                      ? "Diners"
                        : undefined;
          ctrl.$setValidity("invalid", !!scope.ccinfo.type);
          return value;
        });
      }
    };
    return directive;
  })
  .directive("cardExpiration", function() {
    var directive = {
      require: "ngModel",
      link: function(scope, elm, attrs, ctrl) {
        scope.$watch(
          "[ccinfo.month,ccinfo.year]",
          function(value) {
            ctrl.$setValidity("invalid", true);
            if (
              scope.ccinfo.year == scope.currentYear &&
              scope.ccinfo.month <= scope.currentMonth
            ) {
              ctrl.$setValidity("invalid", false);
            }
            return value;
          },
          true
        );
      }
    };
    return directive;
  })

  .directive("rcSubmit", [
    "$parse",
    "$validator",
    function($parse, $validator) {
      return {
        restrict: "AE",
        require: ["rcSubmit", "?form"],
        controller: [
          "$scope",
          function($scope) {
            this.attempted = false;

            var formController = null;

            this.setAttempted = function() {
              this.attempted = true;
            };
            this.setFormController = function(controller) {
              formController = controller;
            };
          }
        ],
        compile: function(cElement, cAttributes, transclude) {
          return {
            pre: function(scope, formElement, attributes, controllers) {},
            post: function(scope, formElement, attributes, controllers) {
              var submitController = controllers[0];
              var formController =
                controllers.length > 1 ? controllers[1] : null;
              var fn = $parse(attributes.rcSubmit);
              formElement.bind("submit", function(event) {
                $validator
                  .validate(scope)
                  .success(function() {
                    scope.$apply(function() {
                      fn(scope, { $event: event });
                    });
                    return true;
                  })
                  .error(function(error) {
                    return false;
                  });
              });
            }
          };
        }
      };
    }
  ])

  // created directive to avoid the undesirable flicker effect caused by the html template display
  .directive("ngCloak", function($timeout) {
    return {
      compile: function(element, attr) {
        attr.$set("ngCloak", undefined);
        element.removeClass("ng-cloak");
      }
    };
  })
  .directive("compareTo", function() {
    return {
      require: "ngModel",
      scope: {
        otherModelValue: "=compareTo"
      },
      link: function(scope, element, attributes, ngModel) {
        ngModel.$validators.compareTo = function(modelValue) {
          return modelValue == scope.otherModelValue;
        };
        scope.$watch("otherModelValue", function() {
          ngModel.$validate();
        });
      }
    };
  })
  .directive('validNumber', function() {
    return {
      require: '?ngModel',
      link: function(scope, element, attrs, ngModelCtrl) {
        if(!ngModelCtrl) {
          return; 
        }

        ngModelCtrl.$parsers.push(function(val) {
          if (angular.isUndefined(val)) {
              var val = '';
          }
          
          var clean = val.replace(/[^0-9\.]/g, '');
          var decimalCheck = clean.split('.');
          if(clean.length >3){
            clean = clean.slice(0,3)
          }
          if(!angular.isUndefined(decimalCheck[1])) {
              decimalCheck[1] = decimalCheck[1].slice(0,2);
              if(decimalCheck[0].length >3){
                decimalCheck[0] = decimalCheck[0].slice(0,3);
              } 
              clean =decimalCheck[0] + '.' + decimalCheck[1];
          }
          
          if (val !== clean) {
            ngModelCtrl.$setViewValue(clean);
            ngModelCtrl.$render();
          }
          return clean;
        });

        element.bind('keypress', function(event) {
          if(event.keyCode === 32) {
            event.preventDefault();
          }
        });
      }
    };
  })
  .filter('convertToInitial', function() {
    return function( firstName, lastName ) {
      var initial = '';
      var tempText = ''; 
      var tempLastName = '';     
      if(firstName){
        initial += firstName.charAt(0).toUpperCase(); 
        tempText = firstName.split(" ");
        if(tempText.length > 1){
          tempLastName = tempText[tempText.length-1].charAt(0).toUpperCase();
        }
      }
      if(lastName){
        initial += lastName.charAt(0).toUpperCase(); 
      } else {       
        initial += tempLastName
      }
      return initial;
    }
  })
  .directive('angularMask', function () {
    return {
      restrict: 'A',
      require: 'ngModel',
      scope: {
        isModelValueEqualViewValues: '='
      },
      link: function ($scope, el, attrs, model) {
        $scope.$watch(function(){return attrs.angularMask;}, function(value) {
          if (model.$viewValue != null){
            model.$viewValue = mask(String(model.$viewValue).replace(/\D/g, ''));
            el.val(model.$viewValue);
          }
        });

        model.$formatters.push(function (value) {
          return value === null ? '' : mask(String(value).replace(/\D/g, ''));
        });

        model.$parsers.push(function (value) {
          model.$viewValue = mask(value);
          var modelValue = $scope.isModelValueEqualViewValues ? model.$viewValue : String(value).replace(/\D/g, '');
          el.val(model.$viewValue);
          return modelValue;
        });

        function mask(val) {
          var format = attrs.angularMask,
          arrFormat = format.split('|');

          if (arrFormat.length > 1) {
            arrFormat.sort(function (a, b) {
              return a.length - b.length;
            });
          }

          if (val === null || val == '') {
            return '';
          }
          var value = String(val).replace(/\D/g, '');
          if (arrFormat.length > 1) {
            for (var a in arrFormat) {
              if (value.replace(/\D/g, '').length <= arrFormat[a].replace(/\D/g, '').length) {
                format = arrFormat[a];
                break;
              }
            }
          }
          var newValue = '';
          for (var nmI = 0, mI = 0; mI < format.length;) {
            if (!value[nmI]) {
              break;
            }
            if (format[mI].match(/\D/)) {
              newValue += format[mI];
            } else {
              newValue += value[nmI];
              nmI++;
            }
            mI++;
          }
          return newValue;
        }
      }
    };
  })
  .directive('format', ['$filter', function ($filter) {
    return {
        require: '?ngModel',
        link: function (scope, elem, attrs, ctrl) {
            if (!ctrl) return;

            ctrl.$formatters.unshift(function (a) {
                return $filter(attrs.format)(ctrl.$modelValue)
            });

            elem.bind('blur', function(event) {
                var plainNumber = elem.val().replace(/[^\d|\-+|\.+]/g, '');
                elem.val($filter(attrs.format)(plainNumber));
            });
        }
    };
}])
  .directive('currencyMask', function() {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attrs, ngModelController) {
        
        var formatNumber = function(value) {
       
          value = value.toString();
          value = value.replace(/[^0-9\.]/g, "");
          var parts = value.split('.');
          parts[0] = parts[0].replace(/\d{1,3}(?=(\d{3})+(?!\d))/g, "$&,");
          if (parts[1] && parts[1].length > 2) {
            parts[1] = parts[1].substring(0, 2);
          }
         
          return parts.join(".");
        };
        var applyFormatting = function() {
          var value = element.val();
          var original = value;
          if (!value || value.length == 0) {
            return
          }
          value = formatNumber(value);
          if (value != original) {
            element.val(value);
            element.triggerHandler('input')
          }
        };
        element.bind('keyup', function(e) {
          var keycode = e.keyCode;
          var isTextInputKey =
            (keycode > 47 && keycode < 58) || // number keys
            keycode == 32 || keycode == 8 || // spacebar or backspace
            (keycode > 64 && keycode < 91) || // letter keys
            (keycode > 95 && keycode < 112) || // numpad keys
            (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
            (keycode > 218 && keycode < 223); // [\]' (in order)
          if (isTextInputKey) {
            applyFormatting();
          }
        });
        element.bind('blur', function(evt) {
          if (angular.isDefined(ngModelController.$modelValue) && ngModelController.$modelValue) {            
            var val = ngModelController.$modelValue.split('.');
            if (val && val.length == 1) {
              if (val != "") {
                ngModelController.$setViewValue(val);
                ngModelController.$render();
              }
            } else if (val && val.length == 2) {
              if (val[1] && val[1].length == 1) {
                ngModelController.$setViewValue(val[0] + '.' + val[1] + '0');
                ngModelController.$render();
              } else if (val[1].length == 0) {
                ngModelController.$setViewValue(val[0]);
                ngModelController.$render();
              }
              applyFormatting();
            }
          }
        })
        ngModelController.$parsers.push(function(value) {
          if (!value || value.length == 0) {
            return value;
          }
          value = value.toString();
          value = value.replace(/[^0-9\.]/g, "");
          return value;
        });
        ngModelController.$formatters.push(function(value) {
          if (!value || value.length == 0) {
            return value;
          }
          value = formatNumber(value);
          return value;
        });
      }
    };
  }).directive('googleplace', function($rootScope) {
    return {
    require: 'ngModel',
    scope: {
      ngModel: '=',
      details: '=?'
    },
    link: function(scope, element, attrs, model ) {
      var options = {
          types: [],
          componentRestrictions: {country: ["us"]}
      };
      scope.gPlace = new google.maps.places.Autocomplete(element[0], options);

      google.maps.event.addListener(scope.gPlace, 'place_changed', function() {
          scope.$apply(function() {
              scope.details = scope.gPlace.getPlace();


              let postal_code;
              let street_number;
              let locality;
              let administrative_area_level_1; // state
              let route;
              let sublocality;
              let _address_components = scope.details.address_components;
              if (_address_components && _address_components.length > 0) {
                _address_components.forEach(function(addressComponent){
                  if (addressComponent.types && addressComponent.types.length > 0){
                    addressComponent.types.forEach(function(type){

                      if (type === 'locality') {
                        locality = addressComponent.long_name
                      }
                      if (type === 'postal_code') {
                        postal_code = addressComponent.long_name;
                      }
                      if (type === 'street_number') {
                        street_number = addressComponent.long_name                      
                      }
                      if (type === 'administrative_area_level_1') {
                        administrative_area_level_1 = addressComponent.long_name
                      }
                      if (type === 'postal_code_suffix') {
                        postal_code = postal_code + addressComponent.long_name.slice(0, -4);
                         
                        //postal_code.slice(0, -1)
                         
                      }
                      if (type === 'route') {
                        route = addressComponent.long_name
                      }
                      if (type === 'sublocality') {
                        sublocality = addressComponent.long_name
                      }
                    })
                  }
                })
              }
              function getAddress(street_number='', route='', sublocality ='') {
                var _add = '';
                if (street_number != '') {
                  _add += street_number
                }
                if (route != '') {
                  if (street_number != '') {
                    _add += ' '
                  }
                  _add += route
                }
                if (sublocality != '') {
                  if (route != '') {
                    _add += ' '
                  }
                  _add += sublocality
                }
                $rootScope.IsVisibleCityState = true;

                return _add;

               
              }
              $rootScope.datafetchedaddress={
                locality:locality,
                postal_code:postal_code,
                street_number:street_number,
                administrative_area_level_1:administrative_area_level_1,
                address: getAddress(street_number, route, sublocality)
              }
              model.$setViewValue(element.val());                
          });
      });
    }
    };
}).directive('googleMap', function () {  
    return {  
        restrict: 'EA',  
        scope: {  
            param: '='  
        },  
        template: '<div id="googlemaps" data-ng-style={"width":param.width,"height":param.height}>' +  
                  '</div>',  
        replace: true,  
        controller: function ($scope, $element, $attrs, $q, $rootScope, $timeout, $compile, apiGateWay, auth) {  
            $rootScope.routeDuration = {};
            var method = function () {  
                var initAttribute = function () {  
                    if (!angular.isDefined($scope.param)) {  
                        $scope.param = {};  
                    }  
  
                    if (!angular.isDefined($scope.param.height)) {  
                        $scope.param.height = '100%';  
                    }                      
  
                    if (!angular.isDefined($scope.param.width)) {  
                        $scope.param.width = '100%';  
                    }  
                    if (!angular.isDefined($scope.param.autoZoom)) {  
                        $scope.param.autoZoom = true;  
                    }  
                    if (!angular.isDefined($scope.param.allowMultipleMark)) {  
                        $scope.param.allowMultipleMark = true;  
                    }   
                    if (!angular.isDefined($scope.param.markerIcon)) { 
                      $scope.param.markerIcon = 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z'; 
                    }   

                  if (!angular.isDefined($scope.param.svgTemplate)) {  
                    //svg = $scope.param.svgTemplate.replace('{{fillColor}}', color);
                    //svg = svg.replace('{{strokeColor}}', '#fff')                    
                    $scope.param.svgTemplate = '<svg width="30px" height="50px" viewBox="0 0 20 42" xmlns="http://www.w3.org/2000/svg"><path style="fill:{{fillColor}};stroke:{{strokeColor}};stroke-miterlimit:10;" d="M10.5,42.498c-2-20-10-22-10-30c0-5.523,4.477-10,10-10	s10,4.477,10,10C20.5,20.498,12.5,22.498,10.5,42.498z"/>{{statusIcon}}</svg>'; 

                    //$scope.param.svgTemplateJob ='<svg width="30px" height="40px" style="enable-background:new -1.3 -0.6 298 298;" version="1.1" viewBox="-1.3 -0.6 298 298"  xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><style type="text/css"><![CDATA[.st0{fill:none;}]]></style><defs/><path style="fill:{{fillColor}};stroke:{{strokeColor}};stroke-miterlimit:10;" d="M12.2,45.2c0-14,11.4-25.4,25.4-25.4h224c14,0,25.4,11.4,25.4,25.4v122.6c0,14-11.4,25.4-25.4,25.4H177l-27.4,83.9  l-27.4-83.9H37.6c-14,0-25.4-11.4-25.4-25.4V45.2L12.2,45.2z"/><rect class="st0" height="40" id="_x3C_Slice_x3E__65_" width="30"/></svg>';

                    $scope.param.svgTemplateJob = '<svg xmlns="http://www.w3.org/2000/svg" width="35" height="36.972" viewBox="0 0 35 36.972"><g id="Group_414" data-name="Group 414" transform="translate(-77 -1541.95)"><g id="Untitled-1" transform="translate(77 1541.853)"><path id="Path_438" data-name="Path 438" style="fill:{{fillColor}};stroke:{{strokeColor}};stroke-miterlimit:10;" d="M12.2,22.921A2.921,2.921,0,0,1,14.857,19.8H38.284a2.921,2.921,0,0,1,2.657,3.121V37.987a2.921,2.921,0,0,1-2.657,3.121H29.436L26.57,51.419,23.7,41.109H14.857A2.921,2.921,0,0,1,12.2,37.988V22.921Z" transform="translate(-8.886 -14.351)"/>{{statusIcon}}</g></g></svg>';

                    $scope.param.statusCompleteObject = '<circle style="fill:#558E40;" cx="17.5" cy="5.047" r="5.047"/><polygon style="fill:#FFFFFF;" points="20.905,3.219 20.183,2.498 16.529,6.152 14.817,4.44 14.095,5.163 16.527,7.596 	16.529,7.592 16.533,7.596 "/>';
                    $scope.param.statusInProgressObject = '<polygon style="fill:#FFFFFF;" points="20.905,3.153 20.183,2.432 16.529,6.087 14.817,4.374 14.095,5.097 16.527,7.53 16.529,7.527 16.533,7.53 "/><g><ellipse style="fill:#FFFFFF;" cx="17.35" cy="5.147" rx="5.091" ry="5.147"/><polygon style="fill:#E69E4E;" points="19.885,3.771 19.347,3.229 16.627,5.979 15.353,4.69 14.816,5.234 16.626,7.065 16.627,7.062 16.63,7.065 	"/><path style="fill:#E69E4E;" d="M16.824,10.266c-0.354-0.037-0.704-0.111-1.042-0.222l0.244-0.76 c0.285,0.093,0.58,0.156,0.879,0.187L16.824,10.266z M17.887,10.265L17.804,9.47c0.299-0.032,0.595-0.096,0.879-0.189l0.245,0.76 C18.592,10.152,18.242,10.227,17.887,10.265z M14.81,9.608c-0.307-0.179-0.597-0.391-0.861-0.632l0.529-0.595 c0.223,0.203,0.468,0.383,0.728,0.534L14.81,9.608z M19.9,9.603l-0.397-0.692c0.26-0.152,0.504-0.333,0.726-0.535l0.53,0.593 C20.496,9.209,20.207,9.422,19.9,9.603z M13.236,8.179c-0.209-0.29-0.389-0.603-0.534-0.93l0.722-0.327 c0.123,0.276,0.274,0.541,0.451,0.785L13.236,8.179z M21.471,8.171l-0.64-0.47c0.177-0.246,0.328-0.511,0.45-0.787l0.722,0.325 C21.859,7.566,21.68,7.879,21.471,8.171z M12.371,6.226c-0.074-0.35-0.112-0.709-0.112-1.069l0.791-0.002 c0,0.305,0.032,0.608,0.095,0.904L12.371,6.226z M22.331,6.215L21.558,6.05c0.062-0.295,0.093-0.599,0.093-0.903l0.791-0.02v0.02 C22.441,5.507,22.404,5.866,22.331,6.215z M13.141,4.252l-0.774-0.164c0.073-0.352,0.183-0.696,0.327-1.024l0.723,0.324 C13.295,3.664,13.203,3.955,13.141,4.252z M21.554,4.225c-0.063-0.296-0.157-0.586-0.28-0.862l0.721-0.329 c0.146,0.327,0.258,0.672,0.333,1.022L21.554,4.225z M13.865,2.6l-0.641-0.468c0.208-0.291,0.446-0.56,0.71-0.801l0.531,0.592 C14.242,2.127,14.04,2.355,13.865,2.6z M20.821,2.579c-0.178-0.245-0.382-0.472-0.605-0.674l0.528-0.596 c0.264,0.239,0.504,0.506,0.714,0.795L20.821,2.579z M15.19,1.387l-0.398-0.691c0.306-0.18,0.633-0.329,0.971-0.441l0.247,0.759 C15.724,1.11,15.448,1.235,15.19,1.387z M19.488,1.374c-0.261-0.151-0.538-0.275-0.822-0.367l0.242-0.761 c0.337,0.109,0.664,0.256,0.973,0.435L19.488,1.374z M16.888,0.824L16.803,0.03C16.986,0.01,17.175,0.006,17.351,0 c0.173,0,0.345,0.009,0.515,0.026l-0.079,0.795c-0.147-0.015-0.298-0.025-0.446-0.022C17.191,0.799,17.039,0.808,16.888,0.824z"/> <path style="fill:#E69E4E;" d="M17.35,0V0.8c2.371,0,4.3,1.95,4.3,4.347s-1.929,4.347-4.3,4.347v0.799 c2.808,0,5.091-2.308,5.091-5.147S20.158,0,17.35,0z"/></g>';
                    $scope.param.statusNoAccessObject = '<rect x="12.247" style="fill:#CE222E;" width="10.426" height="10.619"/><g><path style="fill:#FFFFFF;" d="M19.891,9.2H15.03c-0.287,0-0.521-0.233-0.521-0.519V4.874c0-0.286,0.233-0.519,0.521-0.519h4.861 c0.287,0,0.521,0.233,0.521,0.519v3.806C20.412,8.967,20.178,9.2,19.891,9.2z M15.03,4.701c-0.096,0-0.174,0.078-0.174,0.173v3.806 c0,0.095,0.078,0.173,0.174,0.173h4.861c0.096,0,0.174-0.078,0.174-0.173V4.874c0-0.095-0.078-0.173-0.174-0.173H15.03z"/><path style="fill:#FFFFFF;" d="M19.196,4.701c-0.096,0-0.174-0.077-0.174-0.173V3.317c0-0.859-0.701-1.557-1.563-1.557 c-0.861,0-1.563,0.699-1.563,1.557v1.211c0,0.096-0.078,0.173-0.174,0.173c-0.096,0-0.174-0.077-0.174-0.173V3.317 c0-1.05,0.857-1.903,1.91-1.903s1.91,0.854,1.91,1.903v1.211C19.37,4.624,19.292,4.701,19.196,4.701z"/><path style="fill:#FFFFFF;" d="M17.981,6.431c0-0.286-0.233-0.519-0.521-0.519c-0.287,0-0.521,0.232-0.521,0.519 c0,0.153,0.068,0.29,0.174,0.384v0.481c0,0.191,0.156,0.346,0.347,0.346c0.192,0,0.347-0.155,0.347-0.346V6.816 C17.913,6.721,17.981,6.584,17.981,6.431z"/></g>';

                    $scope.param.statusClosedObject = '<rect id="Rectangle_137" data-name="Rectangle 137" width="6" height="4" transform="translate(12.047 1.615)" fill="#fff"/><path id="Path_441" data-name="Path 441" d="M6.122,39.4H.735A.765.765,0,0,1,0,38.608V32.793A.765.765,0,0,1,.735,32H6.122a.765.765,0,0,1,.735.793v5.815A.765.765,0,0,1,6.122,39.4Zm-3.133-1.62,2.816-3.04a.279.279,0,0,0,0-.374l-.346-.374a.232.232,0,0,0-.346,0l-2.3,2.479L1.744,35.315a.232.232,0,0,0-.346,0l-.346.374a.279.279,0,0,0,0,.374l1.592,1.718a.232.232,0,0,0,.346,0Z" transform="translate(11.599 -32)"/>';
                }  
                  
                                     
                    method.mapConfig()
                }  
  
                var assignMethod = function () {  
                    $scope.param.method = {      
                      mapConfig: function (reInitialize=false) {                                               
                          mapConfig(reInitialize);  
                        },                     
                        setMultipleMark: function (addresses,type="") {                                               
                          setMultipleMark($scope.map, addresses,type);  
                        },                       
                        setSingleRoute: function (routes, optimize=false, preserveViewport=true) { 
                          var deferred = $q.defer();
                          // if($rootScope.activeDates.length > 2){
                          //   deferred.resolve(true);
                          //   return deferred.promise; 
                          // }
                          setSingleRoute($scope.map, routes, optimize, preserveViewport).then(function(response){
                              deferred.resolve(response);                            
                          }, function(error) {
                            deferred.reject(error);
                          }); 
                          return deferred.promise; 
                        },  
                        setFitBounds: function () {                                                 
                          setFitBounds();  
                        },
                        setCenterZoom: function () {                                                 
                          setCenterZoom();  
                        },
                        
                        removeAllRoutes: function () {   
                          var deferred = $q.defer();                                                
                          removeAllRoutes().then(function(response){                          
                            deferred.resolve(response);
                            
                          }, function(error) {
                            deferred.reject(error);
                          }); 
                          return deferred.promise; 
                                   
                        },  
                        removeRoute: function (routeId='') {                                                
                          removeRoute(routeId);                                    
                        },               
                        removeAllMarkers: function () {    
                          var deferred = $q.defer();                                                
                          removeAllMarkers().then(function(response){                          
                            deferred.resolve(response);
                            
                          }, function(error) {
                            deferred.reject(error);
                          }); 
                          return deferred.promise;   
                        },
                        drawCircle: function () { 
                          
                          drawCircle($scope.map);
                        }, 
                    }  
                }  
                var mapConfig = function (reInitialize=false) {
                  $scope.infoWindow = '';
                  $scope.circle = false;  
                  $scope.markers = [];
                  $scope.routeMarkers = {}; 
                  //$scope.routeStatusMarkers = {};
                  $rootScope.directionsRenderer = $rootScope.directionsRenderer ? $rootScope.directionsRenderer : {};
                  $scope.notRoutedMarkers = {};
                  $scope.infoWindowRoute = {};
                  $scope.addresses = [];
                  $scope.retry = {};
                  if($rootScope.userSession.compLatLong){
                    var res = $rootScope.userSession.compLatLong.split(",")
                    $scope.defaultLatLong = new google.maps.LatLng(res[0], res[1]);
                  } else if (auth.getSession().userType == "administrator") {
                    apiGateWay.get("/company/settings").then(function(response) {
                      if (response.data.status == 200 && response.data.data.compLatLong && response.data.data.compLatLong != '') {
                        var res = response.data.data.compLatLong.split(",")
                        $scope.defaultLatLong = new google.maps.LatLng(res[0], res[1]);
                      } else {
                        $scope.defaultLatLong = new google.maps.LatLng(33.44, -112.01);
                      }
                    }, function(error) {
                      $scope.defaultLatLong = new google.maps.LatLng(33.44, -112.01);
                    })
                  } else {
                    $scope.defaultLatLong = new google.maps.LatLng(33.44, -112.01);
                  }
                  $scope.mapOptions = {  
                      center:$scope.defaultLatLong,  
                      zoom: 10,  
                      mapTypeId: google.maps.MapTypeId.ROADMAP,  
                      scrollwheel: $scope.param.autoZoom  
                  };
                  method.initMap(reInitialize);  
                  

                }                  
                var initMap = function (reInitialize=false) { 
                    if ($scope.map === void 0 || reInitialize) {  
                        $scope.map = new google.maps.Map($element[0], $scope.mapOptions); 
                        $scope.oms = new OverlappingMarkerSpiderfier($scope.map, {
                          markersWontMove: true,
                          markersWontHide: true,
                          basicFormatEvents: true
                        });
                        $scope.oms.addListener('spiderfy', function (markerArr) {
                          //infowindow.close();
                        });
                        $scope.oms.addListener('unspiderfy', function (markerArr) {
            
                        });
            
                        $scope.oms.addListener('click', function (marker, event) {

                        })
                        appendCircle($scope.map); 
                        initDragMarker(); 

                    }  
                    if ($scope.directionsService === void 0 || reInitialize) {  
                      $scope.directionsService = new google.maps.DirectionsService;  
                    }    
                }  
                  var removeAllMarkers = function (){
                  var deferredParent = $q.defer();   
                  var loopPromises = [];
                  if($scope.singleMarkers && $scope.singleMarkers.length > 0){
                    for (var i = 0; i < $scope.singleMarkers.length; i++) {  
                      var deferred = $q.defer();
                      loopPromises.push(deferred.promise);   
                      if($scope.singleMarkers[i]){                        
                        $scope.singleMarkers[i].setMap(null);
                        $scope.singleMarkers[i] = null;
                      }
                      deferred.resolve();
                    }
                  } else {
                    var deferred = $q.defer();
                    deferred.resolve(); 
                    loopPromises.push(deferred.promise);
                  }    
                  if($scope.infoWindow && $scope.infoWindow.length > 0){
                    for (var i = 0; i < $scope.infoWindow.length; i++) {   
                      if($scope.infoWindow[i]){                        
                        $scope.infoWindow[i].setMap(null);
                        $scope.infoWindow[i] = null;
                      }
                    }
                  } else {
                    var deferred = $q.defer();
                    deferred.resolve(); 
                    loopPromises.push(deferred.promise);
                  }    

                  $q.all(loopPromises).then(function (res) {  
                    $scope.singleMarkers = [] 
                    $scope.infoWindow= []
                    applyRecalculation();   
                    deferredParent.resolve('All Marker Removed');
                  });

                  return deferredParent.promise;
                 
                }
                var removeRoute = function (routeId=''){ 
                  var deferredParent = $q.defer();
                  var loopPromises = [];
                  if($scope.routeMarkers['_'+routeId]){
                    angular.forEach($scope.routeMarkers['_'+routeId], function(mark, index){  
                      var deferred = $q.defer();
                      loopPromises.push(deferred.promise);
                      if($scope.routeMarkers['_'+routeId][index]){
                        $scope.routeMarkers['_'+routeId][index].setMap(null); 
                        $scope.routeMarkers['_'+routeId][index] = null
                      }   
                      deferred.resolve();
                    })
                  }    
                  /*if($scope.routeStatusMarkers['_'+routeId]){
                    angular.forEach($scope.routeStatusMarkers['_'+routeId], function(mark, index){  
                      var deferred = $q.defer();
                      loopPromises.push(deferred.promise);
                      if($scope.routeStatusMarkers['_'+routeId][index]){
                        $scope.routeStatusMarkers['_'+routeId][index].setMap(null); 
                        $scope.routeStatusMarkers['_'+routeId][index] = null
                      }   
                      deferred.resolve();
                    })
                  }  */
                                
                  if($rootScope.directionsRenderer['_'+routeId]){
                    angular.forEach($rootScope.directionsRenderer['_'+routeId], function(mark, index){  
                      var deferred = $q.defer();
                      loopPromises.push(deferred.promise);
                      if($rootScope.directionsRenderer['_'+routeId][index]){
                        $rootScope.directionsRenderer['_'+routeId][index].setMap(null); 
                        $rootScope.directionsRenderer['_'+routeId][index] = null
                      }    
                      deferred.resolve();
                    })
                  } 
                  $q.all(loopPromises).then(function (res) {
                    applyRecalculation();
                    deferredParent.resolve(routeId);
                  }, function(error){
                    deferredParent.reject();
                  });
                  
                  return deferredParent.promise;
                }
                var removeAllRoutes = function (){  
                  //var routeMarkers = angular.copy($scope.routeMarkers)
                  var deferredParent = $q.defer();   
                  var loopPromises = [];
                  if(Object.entries($scope.routeMarkers).length > 0){                   
                    angular.forEach(Object.entries($scope.routeMarkers), function(item){             
                      angular.forEach(item[1], function(mark, index){  
                        var deferred = $q.defer();
                        loopPromises.push(deferred.promise);
                        if($scope.routeMarkers[item[0]][index]){
                          $scope.routeMarkers[item[0]][index].setMap(null); 
                          $scope.routeMarkers[item[0]][index] = null;                              
                        }   
                        deferred.resolve();                                  
                      }) 
                    })   
                  } else {
                    var deferred = $q.defer();
                    deferred.resolve(); 
                    loopPromises.push(deferred.promise);
                  }      
                  
                  /*if(Object.entries($scope.routeStatusMarkers).length > 0){                   
                    angular.forEach(Object.entries($scope.routeStatusMarkers), function(item){             
                      angular.forEach(item[1], function(mark, index){  
                        var deferred = $q.defer();
                        loopPromises.push(deferred.promise);
                        if($scope.routeStatusMarkers[item[0]][index]){
                          $scope.routeStatusMarkers[item[0]][index].setMap(null); 
                          $scope.routeStatusMarkers[item[0]][index] = null;                              
                        }   
                        deferred.resolve();                                  
                      }) 
                    })   
                  } else {
                    var deferred = $q.defer();
                    deferred.resolve(); 
                    loopPromises.push(deferred.promise);
                  }*/


                  
                  //var directionsRenderer = angular.copy($scope.routeMarkers)
                  if(Object.entries($rootScope.directionsRenderer).length > 0){        
                    angular.forEach(Object.entries($rootScope.directionsRenderer), function(item){  
                      angular.forEach(item[1], function(mark, index){  
                        var deferred = $q.defer();
                        loopPromises.push(deferred.promise);
                        if($rootScope.directionsRenderer[item[0]][index]){
                          $rootScope.directionsRenderer[item[0]][index].setMap(null); 
                          $rootScope.directionsRenderer[item[0]][index] = null;                              
                        }   
                        deferred.resolve();                                  
                      }) 

                    })   
                  } else {
                    var deferred = $q.defer();
                    deferred.resolve(); 
                    loopPromises.push(deferred.promise);
                  }                
                  $q.all(loopPromises).then(function (res) {  
                    $scope.routeMarkers = {} 
                    $rootScope.directionsRenderer = {}
                    applyRecalculation();   
                    deferredParent.resolve('All Route Removed');
                  });
                  
                  return deferredParent.promise;
                }
                var setFitBounds = function (){
                  var bounds = new google.maps.LatLngBounds();
                  var isHaveMarker = false;
                  if($scope.singleMarkers && $scope.singleMarkers.length > 0){
                    angular.forEach($scope.singleMarkers, function(item, index){
                      if($scope.singleMarkers[index]){
                        bounds.extend($scope.singleMarkers[index].position); 
                        isHaveMarker = true;
                      }                   
                    })                    
                  }
                  if($scope.routeMarkers){                   
                    angular.forEach(Object.entries($scope.routeMarkers), function(item){                 
                      angular.forEach(item[1], function(mark, index){  
                        if($scope.routeMarkers[item[0]][index]){
                         bounds.extend($scope.routeMarkers[item[0]][index].position); 
                         isHaveMarker = true;
                        }                                     
                      }) 
                    })   
                  }
                 if(isHaveMarker){
                  $scope.map.fitBounds(bounds); 
                 } else {
                  setCenterZoom();
                 }
                                   
                }
                var setCenterZoom = function (){                  
                    $scope.map.setCenter($scope.defaultLatLong, 10);                 
                    $scope.map.setZoom(10);                 
                }
                
                var initDragMarker = function () { 
                  if ($scope.gDrag === void 0) {  
                    $rootScope.gDrag  = $scope.gDrag = {
                        jq: {},
                        item: {},
                        status: 0,
                        y: 0,
                        x: 0
                      }
                      $scope.gDrag.jq = angular.element(document.getElementById("markerPlaceHolder"));
                      $scope.gDrag.jq.draggable({
                        start: function(event, ui){                   
                          var fillColor =  $scope.gDrag.item.fillColor;
                          var strokeColor =  $scope.gDrag.item.strokeColor;
                          var labelText =  $scope.gDrag.item.label.text;
                          var labelColor = $scope.gDrag.item.label.color;
                          var jobStatusImage = $scope.gDrag.item.jobStatusImage ? '<img src="'+$scope.gDrag.item.jobStatusImage+'" />' : '';
                         
                          $scope.gDrag.jq.html('<div class="drag-marker">'+jobStatusImage+'<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="-44.2 168.2 108.7 201.2"><path style="fill:'+fillColor+';stroke:'+strokeColor+'" d="M10.2,168.2c-30,0-54.4,26.4-54.4,59.6c0,7.4,1.4,15.4,4,22.6h0l0.2,0.5c0.2,0.5,0.4,1,0.6,1.5l49.6,116.9 L59.5,253l0.2-0.5c0.2-0.5,0.4-1,0.6-1.5l0.2-0.5c2.6-7.2,4-14.9,4-22.6C64.6,194.5,40.2,168.2,10.2,168.2z"/></svg><span style="color:'+labelColor+'">'+labelText+'</span></div>');
                          $scope.gDrag.item.setVisible(false);
                          if($scope.gDrag.item.statusMarker.isStatusMarker){ 
                           
                            //$scope.routeStatusMarkers['_'+$scope.gDrag.item.statusMarker.routeId][$scope.gDrag.item.statusMarker.count].setVisible(false);
                          }
                          
                          $scope.gDrag.item.setVisible(false);
                        },
                        
                        stop: function(event, ui){
                          
                          $scope.gDrag.jq.html('');
                          
                          /*Chech if targed was droped in our dropable area*/
                           if($rootScope.gDrag.status){
                            $scope.gDrag.item.setVisible(false);
                          }else{
                            
                               $scope.gDrag.jq.offset({
                                top: -30,
                                left: 0
                              }); 
                              $scope.gDrag.item.setVisible(true);
                              if($scope.gDrag.item.statusMarker.isStatusMarker){ 
                               
                                //$scope.routeStatusMarkers['_'+$scope.gDrag.item.statusMarker.routeId][$scope.gDrag.item.statusMarker.count].setVisible(true);
                              }
                            
                          } 
                        }
                      });
    
                      angular.element($scope.gDrag.jq).click(function(event){
                        google.maps.event.trigger($scope.gDrag.item, 'click');
                      });
                      angular.element(document).mousemove(function(event){
                        $scope.gDrag.x = event.pageX;
                        $scope.gDrag.y = event.pageY;
                      });

                    }  
                        
                }

                var attachDragMaker = function(marker, isStatusMarker, routeId, count, addressDetail={}){
                  google.maps.event.addListener(marker, 'mouseover', function(e){  
                    if(!$scope.gDrag.jq.hasClass('ui-draggable-dragging')){
                    
                      //$scope.routeStatusMarkers['_'+routeId][count].visible = false;
                     
                     $scope.gDrag.item = marker;
                     $scope.gDrag.item.statusMarker = {isStatusMarker, routeId, count}
                     $scope.gDrag.item.addressDetail = addressDetail
                     $scope.gDrag.status = 0;
                     $scope.gDrag.jq.offset({
                       top: $scope.gDrag.y - 10,
                       left: $scope.gDrag.x - 10
                     });
                     $timeout(function(){ 
                      $rootScope.gDrag = $scope.gDrag;  
                    })
                      
                   } 
                 });

                }
                var timeConvert= function(time){
                  var num = time;
                  var hours = (num / 60);
                  var rhours = Math.floor(hours);
                  var minutes = (hours - rhours) * 60;
                  var rminutes = Math.round(minutes);
                  return rhours + "." + rminutes;
                }
                 
                var setDefault =  function(){
                    $timeout(function(){ 
                      $rootScope.addSelection = false;
                      $rootScope.techPayPerVisit = 0;
                      $rootScope.timePerVisit = '0.0';
                      $rootScope.propertyCount = 0;
                      $rootScope.isCircle = false;  
                    })   
                    //$rootScope.$apply();  
                }
                var applyRecalculation =  function(){
                  if($scope.circle){
                    $timeout(function(){ 
                    selectionCalculation($scope.circle);
                  })
                  }
                }
                var selectionCalculation = function(circle){
                  //var bounds = circle.getBounds();
                  var tech_pay_per_visit= 0;
                  var time_per_visit = 0;
                  var nonRoutePropertyCount = 0;
                  angular.forEach($scope.singleMarkers, function(item, index){
                    if($scope.singleMarkers[index]){
                      if(google.maps.geometry.spherical.computeDistanceBetween($scope.singleMarkers[index].getPosition(), circle.getCenter()) <= circle.getRadius()) {
                        
                        if($scope.singleMarkers[index].tech_pay_per_visit){
                          tech_pay_per_visit = parseFloat($scope.singleMarkers[index].tech_pay_per_visit) + parseFloat(tech_pay_per_visit); 
                        }

                        if($scope.singleMarkers[index].time_per_visit){
                          time_per_visit = parseInt($scope.singleMarkers[index].time_per_visit) + parseInt(time_per_visit);
                        }
                        nonRoutePropertyCount++;
                      } 
                    }                   
                  })
                  var route_tech_pay_per_visit= 0;
                  var route_time_per_visit = 0;
                  var routePropertyCount = 0;
                  if($scope.routeMarkers){                   
                    angular.forEach(Object.entries($scope.routeMarkers), function(item){  
                      angular.forEach(item[1], function(mark, index){  
                        if($scope.routeMarkers[item[0]][index] && $scope.routeMarkers[item[0]][index].addressId){
                          if(google.maps.geometry.spherical.computeDistanceBetween($scope.routeMarkers[item[0]][index].getPosition(), circle.getCenter()) <= circle.getRadius()) {
                            
                            if($scope.routeMarkers[item[0]][index].tech_pay_per_visit){
                              route_tech_pay_per_visit = parseFloat($scope.routeMarkers[item[0]][index].tech_pay_per_visit) + parseFloat(route_tech_pay_per_visit); 
                            }
    
                            if($scope.routeMarkers[item[0]][index].time_per_visit){
                              route_time_per_visit = parseInt($scope.routeMarkers[item[0]][index].time_per_visit) + parseInt(route_time_per_visit);
                            }
                            routePropertyCount++;
                          }
                        }                                     
                      }) 
                    })   
                  }
                  var techPayPerVisit = parseFloat(tech_pay_per_visit) + parseFloat(route_tech_pay_per_visit);
                  if(techPayPerVisit>0){
                    $rootScope.techPayPerVisit = techPayPerVisit.toFixed(2);
                  }else{
                    $rootScope.techPayPerVisit = techPayPerVisit;
                  }
                  
                  $rootScope.timePerVisit = timeConvert(time_per_visit+route_time_per_visit);
                  $rootScope.propertyCount = routePropertyCount+nonRoutePropertyCount;  
                  $rootScope.isCircle = true;
                  $rootScope.$apply();
                }
                var existCircle = false;
                var disableMarkerClick = function(status){
                  if(status){
                    $('.gm-style div[title=""]').addClass('hide');
                    $('#markerPlaceHolder').addClass('hide');
                  } else {
                    $('.gm-style div[title=""]').removeClass('hide');
                    $('#markerPlaceHolder').removeClass('hide');
                  }
                 
                }                
                var drawCircle = function(map){
                  if($rootScope.addSelection){   
                    disableMarkerClick(true); 
                    map.setOptions({ draggableCursor : "crosshair" })
                  }else{
                    disableMarkerClick(false);                    
                    map.setOptions({draggableCursor:''}); 
                  }

                  if(existCircle && $scope.circle){
                    $scope.circle.setMap(null);
                    $scope.circle = false;
                    existCircle = false;
                    setDefault();
                    
                  } 
                }
                var appendCircle = function(map){
                  
                map.addListener('click', function (event) {       
                   
                    var zoomLevel = map.getZoom();
                    zoomLevel = zoomLevel==0?1:zoomLevel;
                    var radious = parseInt(50000/zoomLevel);
                    var circle = new google.maps.Circle({
                        strokeColor: '#bbb',
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: '#FF0000',
                        fillOpacity: 0.35,
                        draggable:true,
                        editable: true,
                        center: event.latLng,
                        radius: radious,
                        suppressUndo: true
                      });
                      
                       if(existCircle){
                        existCircle.setMap(null);
                        existCircle = false;
                        $scope.circle = existCircle;
                        setDefault();
                        return;
                      } 
                      if(!existCircle && $rootScope.addSelection){
                        circle.setMap(map);
                        existCircle = circle;
                        $scope.circle = circle;
                        $timeout(function(){ 
                          selectionCalculation(circle);
                        },200);
                        map.setOptions({draggableCursor:''});
                       
                      }
                     
                      
                      google.maps.event.addListener(circle, 'dragend', function() {
                        selectionCalculation(circle);
                        
                      });
                  
                      google.maps.event.addListener(circle, 'radius_changed', function() {
                          selectionCalculation(circle);         
                      });

                      google.maps.event.addListener(circle, 'center_changed', function() {
                        selectionCalculation(circle);         
                      });
                      
                      disableMarkerClick(false);     
                   });   
                }              
              
                var setMultipleMark = function (map, addresses, type='') {  
                  if($rootScope.gDrag.jq){
                    $timeout(function(){ 
                      $rootScope.gDrag.jq.offset({
                        top: -30,
                        left: 0
                      });
                    })
                  }
                  if($scope.singleMarkers && $scope.singleMarkers.length > 0){
                    for (var i = 0; i < $scope.singleMarkers.length; i++) {     
                      if($scope.singleMarkers[i]){                        
                        $scope.singleMarkers[i].setMap(null);
                        $scope.singleMarkers[i] = null;
                      }
                    }
                  }
                  if($scope.infoWindow && $scope.infoWindow.length > 0){
                    for (var i = 0; i < $scope.infoWindow.length; i++) {   
                      if($scope.infoWindow[i]){                        
                        $scope.infoWindow[i].setMap(null);
                        $scope.infoWindow[i] = null;
                      }
                    }
                  }
                  $scope.singleMarkers = [];
                  $scope.infoWindow = []; 
                  var tempAddressId = '';
                  if(addresses.length > 0 && !addresses[0].isHidden){
                    angular.forEach(addresses, function(item, index){
                      if(item.latitude && item.longitude && item.addressId != tempAddressId ){ 
                        if(!item.hasOwnProperty('isOneOfJob') && $rootScope.nonRoutedJobTempId.indexOf(item.tempJobId) != -1){
                          item.isOneOfJob = 1;
                        }
                        
                        var fillColor = '#fff';
                        var strokeColor = '#000';
                        var fontColor = '#000';
                        if(type == 'nearest'){
                          fillColor = (index == 0 ? '#ff0000' : (item.routeId ? '#285fc6' : '#fff'))
                          strokeColor = (index == 0 ? '#fff' : (item.routeId ? '#fff' : '#000'))
                          fontColor = (index == 0 ? '#fff' : (item.routeId ? '#fff' : '#000'))
                        } 
                          
                        var text = (type == 'nearest') ? item.nameinitial : (item.sNo ? (item.sNo).toString() : '');                        
                        var svg = '';               
                        //svg = $scope.param.svgTemplate.replace('{{fillColor}}', fillColor);
                        svg = item.isOneOfJob==1? $scope.param.svgTemplateJob.replace('{{fillColor}}', fillColor) : $scope.param.svgTemplate.replace('{{fillColor}}', fillColor);
                        svg = svg.replace('{{strokeColor}}', strokeColor);                
                        var icon = { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg), labelOrigin: { x: 16, y: 16} };

                        var label = {   
                          text: text ? text.toUpperCase() : '',
                          color: fontColor,
                          fontSize: (type == 'nearest') ? '10px' : '12px'
                        }                                 
                        var marker_lat_lng = new google.maps.LatLng(item.latitude, item.longitude);

                        if(!item.routeId){   
                          item['routeId'] = 0;                     
                        }                         
                        var routeDetail = '';
                        var showNearestLink = '';
                      
                        if(type == 'nearest' && item.routeData){ 
                          routeDetail = '<span class="route-detail-map-popup">'+item.routeData.split('|').join('<br />')+'</span>';                               
                        } else {
                          showNearestLink = '<a ng-click="showNearestLocation('+item.routeId+','+item.addressId+','+item.latitude+','+item.longitude+')" href="#">Show Nearest</a>';
                        }                      

                        var moveMethod = '';
                        
                        if((type == 'nearest' && index == 0) || type != 'nearest'){  
                          if(item.isOneOfJob == 1){
                            moveMethod = '<div class="text-center"><a ng-click="openMoveJobPopupFromMarker('+item.addressId+', '+item.jobId+', '+item.routeId+')">Move</a></div>';
                          }else{
                            moveMethod = '<div class="text-center"><a ng-click="openMoveAddressPopupFromMarker('+item.addressId+', '+index+', '+item.routeId+')">Move</a></div>';
                          }
                          
                        }        
                        if(item.jobStatusImage){
                          moveMethod = '';
                        }
                        
                        $scope.singleMarkers[index] = generateMarker(map, marker_lat_lng, '', label, icon, fillColor, '',item);
                        if(type!='nearest'){
                          attachDragMaker($scope.singleMarkers[index]);
                        }
                        var data = [item];
                        var techName = "(None)";
                        //data[0].jobDetail = data[0].jobDetail ? data[0].jobDetail : {};

                        if(!data[0].jobDetail){
                          data[0].jobDetail = {
                            period : (data[0].period ? data[0].period : '(None)'),
                            note : (data[0].note ? data[0].note : '(None)'),
                            instruction : (data[0].instruction ? data[0].instruction : '(None)')
                          };
                        }
                        data[0].jobDetail.period = data[0].jobDetail.period ? data[0].jobDetail.period : '(None)';
                        data[0].jobDetail.note = data[0].jobDetail.note ? data[0].jobDetail.note : '(None)';
                        data[0].jobDetail.instruction = data[0].jobDetail.instruction ? data[0].jobDetail.instruction : '(None)';
                        item.routeName = item.routeName ? item.routeName : '(Unscheduled)';
                        item.routeTech = item.routeTech ? item.routeTech : '';
                        var htmlElement = (!data[0].isOneOfJob || data[0].isOneOfJob == 0) ? '<div class="text-center"><b><a class="h-1x" href="'+('/app/customerdetail/'+(item.primaryAddressId))+'">'+item.displayName+'</a></b><br /><a class="h-1x address-link-map-popup" href="/app/locationdetail/'+item.addressId+'">'+item.address+'<br />'+item.city+', '+item.state+' '+item.zipcode+'</a><hr class="map-popup-hr" /><div class="p-t10"><b>'+item.routeName+'</b></div><div class="p-t10">'+item.routeTech+'</div><hr class="map-popup-hr" />'+routeDetail+'<div class="p-t10">'+showNearestLink+moveMethod+'</div></div>' 
                          :
                          '<div class="job-container map-view"><b class = "display-name display-name-job-window"><a href="'+('/app/customerdetail/'+(data[0].primaryAddressId))+'">'+data[0].displayName+'</a></b><p class = "address-one address-one-job-window"><a href="/app/locationdetail/'+data[0].addressId+'">'+data[0].address+'<br />'+data[0].city+', '+data[0].state+' '+data[0].zipcode+'</a></p><hr class="map-popup-hr hr-popup" /><div class = "tech-section"><div class = "technician"><p class = "time-check">TECHNICIAN</p><p class= "view-detail">'+techName+'</p></div><div class = "time-window"><p class = "time-check">TIME WINDOW<p/><p class = "view-detail">'+data[0].jobDetail.period+'</p></div></div><hr class="map-popup-hr hr-popup" /><div><p class = "time-check">OFFICE NOTES<p></div> <p class = "instruct">'+data[0].jobDetail.note +'</p> <div class = "tech-instruction"><p class = "time-check">TECH INSTRUCTIONS</p><p class = "instruct">'+data[0].jobDetail.instruction+'</p></div><button class = "job-map"><a class="h-1x job-one" href="/app/one-time-job/'+data[0].addressId+'/'+data[0].jobId+'">open job</a></button><div class="p-t10" style="text-align: center"><b>'+item.routeName+'</b></div><div class="p-t10 nearest-location"><a ng-click="showNearestLocation('+data[0].routeId+','+data[0].addressId+','+data[0].latitude+','+data[0].longitude+')">Show Nearest</a>'+moveMethod+'</div></div>';
                          var content  = $compile(htmlElement)($rootScope);
                        generateInfoWindow($scope.singleMarkers[index], 'not_routed', index, content[0]);
                          
                        //$scope.singleMarkers[index].setMap(map);
                        $scope.oms.addMarker($scope.singleMarkers[index]); 
                        
                   
                      }
                      tempAddressId = item.addressId;
                    });                    
                    /*if(type == 'nearest'){
                      map.setCenter(new google.maps.LatLng(addresses[0].latitude, addresses[0].longitude))  
                    } */           
                  }
                  applyRecalculation();
                } 
              // Set Address Path
              $rootScope.routeCache = {};
              $rootScope.activeDates = [];
              var setSingleRoute = function (map, route={}, optimize=false, preserveViewport=false) {
                  if($rootScope.gDrag.jq){
                      $timeout(function(){ 
                          $rootScope.gDrag.jq.offset({
                          top: -30,
                          left: 0
                          });
                      })
                  }
                  var deferredParent = $q.defer(); 
                  var loopPromises = [];
                  var addresses = route.addresses;                   
                  var cacheIndex = "route_"+ route.id + "_" + route.addresses.length;
                  $rootScope.routeCache[cacheIndex] = $rootScope.routeCache[cacheIndex] ? $rootScope.routeCache[cacheIndex] : {};
                  /*
                      routeMarkers
                      directionsRenderer
                      generateInitialRoute
                      generateAttachedRoute
                      tempAddress
                      tempAddressIds

                  */
                  var wayPointOrder = [];  
                  removeRoute(route.id).then(function(res){                   
                      $scope.routeMarkers['_'+route.id] = [];
                      //$scope.routeStatusMarkers['_'+route.id] = [];
                      $rootScope.directionsRenderer['_'+route.id] = [];                                 
                      if(addresses.length > 0 && !route.isHidden){
                      var maxRouteSize = 25;
                      var results = chunkArray(angular.copy(addresses), maxRouteSize); 
                      var requests = [];                      
                      angular.forEach(results, function(item, index){   
                                  
                          if(index == 0){    
                          loopPromises.push(generateInitialRoute(map, route, item, optimize, preserveViewport, index).then(function(res){  
                              return res;                  
                          }, function(error) {
                              return error;
                          }))
                          }
                          if(index > 0){
                          var length = results[index-1].length-1
                          var addonStartAddress = results[index-1][length];
                          var startIndex = (maxRouteSize*index)+1;
                          var deferred = $q.defer();                          
                          loopPromises.push(deferred.promise)
                          setTimeout(function(){ 
                              generateAttachedRoute(map, route, item, optimize, preserveViewport, startIndex, addonStartAddress, index).then(function(res){  
                              deferred.resolve(res);                  
                              }, function(error) {
                              //deferred.reject(error);
                              deferred.resolve(error);                                
                              })
                          }, 1000);
                          }                
                      });
                      
                      } else {
                      deferredParent.resolve();
                      }
                      var tempAddress = [];
                      var tempAddressIds = [];
                      var error = {status:false, message:''};
                      $q.all(loopPromises).then(function(res) {                        
                      angular.forEach(res, function(array, index){   
                          if(array.error && array.error.status){
                          error = array.error;
                          }                   
                          tempAddress = angular.copy(tempAddress).concat(array.tempAddress)
                          tempAddressIds = angular.copy(tempAddressIds).concat(array.tempAddressIds)        
                      })
                      if(!error.status){
                          applyRecalculation();
                          $rootScope.routeCache[cacheIndex].tempAddress = tempAddress;
                          $rootScope.routeCache[cacheIndex].tempAddressIds = tempAddressIds;

                          deferredParent.resolve({tempAddress, tempAddressIds});
                      } else {
                          removeRoute(route.id);
                          if(error.message != 'OVER_QUERY_LIMIT'){
                          deferredParent.reject({error});
                          } else {
                          error.message = '';
                          deferredParent.reject({error});
                          }
                          
                      }
                      });
                  }) 
                              
              return deferredParent.promise;
              }  
              
              var filterValidAdd = function(route, OrgAddresses){
                var addresses = [];
                var lastLatLongArr = OrgAddresses.filter(function(add){return (add.latitude && add.longitude)});
                var lastLatLong = lastLatLongArr.length > 0 ? lastLatLongArr[0] : OrgAddresses[0];
                angular.forEach(OrgAddresses, function(add, ind){
                  if(!add.latitude || !add.longitude){
                    var latLng = Object.assign({}, lastLatLong);
                    // add.latitude = latLng.latitude;
                    // add.longitude = latLng.longitude;
                    var suffix = (!add.oneOfJobId || add.oneOfJobId == 0) ? add.addressId : add.oneOfJobId;
                    if (!$("#addBox_"+ route.id +"_"+ suffix).hasClass("invalid-route-property")) {
                      setInterval(function(){
                          $("#addBox_"+ route.id +"_"+ suffix).addClass('invalid-route-property');
                      }, 100);         
                    }
                  }
                  addresses.push(add);
                });
                return addresses;
              }

              var generateInitialRoute = function(map, route, OrgAddresses, optimize, preserveViewport, index){
                var addresses = filterValidAdd(route, OrgAddresses);
                var deferred = $q.defer();
                var cacheIndex = "route_"+ route.id + "_" + route.addresses.length;                                                          
                var color = route.color;
                var isStartPoint = false;
                var origin='';
                if(!$rootScope.directionsRenderer['_'+route.id]){
                  $rootScope.directionsRenderer['_'+route.id] = [];
                }
                if(route.custStartAddrLatLong){
                    var originLatLong = route.custStartAddrLatLong;
                    var latLong = originLatLong.split(",");
                    if(Array.isArray(latLong)){
                      origin = new google.maps.LatLng(latLong[0], latLong[1]);
                      isStartPoint = true;
                    }else{
                      origin = new google.maps.LatLng(addresses[0].latitude, addresses[0].longitude);
                      isStartPoint = false;
                    }
                }else{
                    origin = new google.maps.LatLng(addresses[0].latitude, addresses[0].longitude);
                    isStartPoint = false;
                }
                var destination = new google.maps.LatLng(addresses[addresses.length-1].latitude, addresses[addresses.length-1].longitude);
                var wayPoints = []; 
                var count = 0;
                var countStatusIcon = 0;
                
                var i = isStartPoint?0:1;    
                for (i; i < addresses.length; i++) { 
                    wayPoints.push({
                        location: new google.maps.LatLng(addresses[i].latitude, addresses[i].longitude),
                        stopover: true
                    }); 
                }
                
                if(wayPoints.length > 0 || origin){                     
                    if(!$rootScope.routeCache[cacheIndex].directionsRenderer){
                        $rootScope.routeCache[cacheIndex].directionsRenderer = [];
                    }
                    var cachedInfo = $rootScope.routeCache[cacheIndex].directionsRenderer[index];
                    if(cachedInfo && cachedInfo.ref){
                        $rootScope.directionsRenderer['_'+route.id][index] = cachedInfo.ref;
                    }else{
                        $rootScope.directionsRenderer['_'+route.id][index] = new google.maps.DirectionsRenderer({
                            suppressMarkers: true,
                            polylineOptions: { strokeColor: color },
                            preserveViewport: preserveViewport,
                        });                      
                    }
                    $rootScope.directionsRenderer['_'+route.id][index].setMap(map); 
                    
                    var routeDateExistInActiveDates = function(activeDates, currentDate) {
                      var _markerActiveDates = [];
                      var res = false;
                      if(activeDates && activeDates.length > 0) {
                        activeDates.forEach(function(_date){
                          _date = moment(_date).format('YYYY-MM-DD').toLowerCase();
                          _markerActiveDates.push(_date)
                        })
                      }
                      if (_markerActiveDates.includes(currentDate)) {                        
                        res = true
                      }
                      if ($rootScope.isHideAllRoute) {
                        res = false
                      }
                      return res;
                    }

                    var routeFunction = function(response, status, route){  
                          var techName = route.techFirstname ? (route.techFirstname + " " + route.techLastname) : "(No tech assigned)";
                          //routeDateExistInActiveDates($rootScope.activeDates, route.currentDate) &&
                          if(!$rootScope.directionsRenderer['_'+route.id]){
                              $rootScope.directionsRenderer['_'+route.id] = [];
                              $rootScope.directionsRenderer['_'+route.id][index] = new google.maps.DirectionsRenderer({
                                suppressMarkers: true,
                                polylineOptions: { strokeColor: color },
                                preserveViewport: preserveViewport,
                              });
                            }
                            if(!$scope.routeMarkers['_'+route.id]){
                              $scope.routeMarkers['_'+route.id] = [];
                            }

                            if(!optimize){
                              $rootScope.routeCache[cacheIndex].directionsRenderer[index] = {ref : $rootScope.directionsRenderer['_'+route.id][index], response : response, status : status};
                            }else{
                              $rootScope.routeCache[cacheIndex].directionsRenderer[index] = {};
                            }
                            
                            if(response && status == 'OK' && response.routes  && response.routes.length > 0 && $rootScope.directionsRenderer[("_" + route.id)] && $rootScope.directionsRenderer[("_" + route.id)][index]){                                
                              if(routeDateExistInActiveDates($rootScope.activeDates, route.currentDate)) {
                                $rootScope.directionsRenderer['_'+route.id][index].setDirections(response);                               
                              }else{
                                $rootScope.directionsRenderer['_'+route.id][index].setMap(null);
                                return;
                              } 
                            // $rootScope.routeCache[cacheIndex].directionsRenderer[index] = {ref : $rootScope.directionsRenderer['_'+route.id][index], response : response, status : status};
                            if(!$rootScope.routeCache[cacheIndex].directionsRenderer[index].markers){
                                $rootScope.routeCache[cacheIndex].directionsRenderer[index].markers = []; 
                            }

                            var g_route = response.routes[0]; 
                            var i = isStartPoint?1:0;
                            var tempAddress = [];      
                            var tempStartAddress = [];
                            var tempAddressIds = [];
                            if(!isStartPoint){
                                tempAddress.push(addresses[0]);
                                tempAddressIds.push(addresses[0].addressId);
                            }
                            angular.forEach(g_route.waypoint_order, function(elementPos, tempIndex){
                                tempAddress.push(addresses[(isStartPoint ? elementPos : elementPos+1)]);
                                tempAddressIds.push(addresses[(isStartPoint ? elementPos : elementPos+1)].addressId);                 
                            });   

                            
                            var totalDuration = 0;
                            var totalDistance = 0;
                            angular.forEach(g_route.legs, function(v,k){
                                totalDistance = totalDistance + v.distance.value; // distance is in meter
                                totalDuration = totalDuration + v.duration.value; // duration is in sec
                            })
                            
                            $rootScope.routeDuration[route.id] = {duration : totalDuration, distance : (totalDistance / 1609).toFixed(2) + 'mi'};
                            
                            for (i; i < g_route.legs.length; i++) { 
                                if(routeDateExistInActiveDates($rootScope.activeDates, route.currentDate)) {                                  
                                    var data = tempAddress.filter(function(item, childIndex) {     
                                    var addressIndex = isStartPoint ? childIndex+1 : childIndex;                  
                                    if(i == addressIndex) {                                 
                                        return item;  
                                    }
                                    });
                                    data[0].routeId = route.id;
                                    var moveMethod = '';         
                                    var isStatusMarker = false;
                                    //generate status icon    
                                    $scope.routeMarkers['_'+route.id][count] ? $scope.routeMarkers['_'+route.id][count].setMap(null) : '';
                                    $scope.routeMarkers['_'+route.id][count] = generateMarker(map, new google.maps.LatLng(data[0].latitude, data[0].longitude), isStartPoint, '', '', color, i, data[0]); 
                                    $scope.routeMarkers['_'+route.id][count].setMap(map);                     
                                    if(data[0].jobStatusImage){    
                                    isStatusMarker = true; 
                                    } else {
                                    if(data[0].oneOfJobId && data[0].oneOfJobId > 0){
                                        let o = "'"+route.currentDate+"'";
                                        moveMethod = '<br /><a ng-click="setFromDateMarker('+o+'); openMoveJobPopupFromMarker('+data[0].addressId+', '+data[0].oneOfJobId+','+data[0].routeId+')">Move</a>'; 
                                    }else{
                                        let o = "'"+route.currentDate+"'";
                                        moveMethod = '<br /><a ng-click="setFromDateMarker('+o+'); openMoveAddressPopupFromMarker('+data[0].addressId+','+data[0].id+', '+data[0].routeId+')">Move</a>'; 
                                    }
                                    
                                    attachDragMaker($scope.routeMarkers['_'+route.id][count], isStatusMarker,  route.id, countStatusIcon, data[0]);
                                    }
                                    
                                    if(!data[0].jobDetail){
                                    data[0].jobDetail = {
                                        period : (data[0].period ? data[0].period : '(None)'),
                                        note : (data[0].note ? data[0].note : '(None)'),
                                        instruction : (data[0].instruction ? data[0].instruction : '(None)')
                                    };
                                    }

                                    data[0].jobDetail.period = data[0].jobDetail.period ? data[0].jobDetail.period : '(None)';
                                    data[0].jobDetail.note = data[0].jobDetail.note ? data[0].jobDetail.note : '(None)';
                                    data[0].jobDetail.instruction = data[0].jobDetail.instruction ? data[0].jobDetail.instruction : '(None)';

                                    var htmlElement = (!data[0].isOneOfJob || data[0].isOneOfJob == 0) ? '<div class="text-center"><b><a class="h-1x" href="'+('/app/customerdetail/'+(data[0].primaryAddressId))+'">'+data[0].displayName+'</a></b><br /><a class="h-1x address-link-map-popup" href="/app/locationdetail/'+data[0].addressId+'">'+data[0].address+'<br />'+data[0].city+', '+data[0].state+' '+data[0].zipcode+'</a><hr class="map-popup-hr" />'+'<div class="p-t10"><b>'+route.title+'</b></div><div class="p-t10">'+techName+'</div><hr class="map-popup-hr"/>'+'<div class="p-t10"><a ng-click="showNearestLocation('+data[0].routeId+','+data[0].addressId+','+data[0].latitude+','+data[0].longitude+')">Show Nearest</a>'+moveMethod+'</div></div>'
                                    :
                                    '<div class="job-container map-view"><b class = "display-name display-name-job-window"><a href="'+('/app/customerdetail/'+(data[0].primaryAddressId))+'">'+data[0].displayName+'</a></b><p class = "address-one address-one-job-window"><a href="/app/locationdetail/'+data[0].addressId+'">'+data[0].address+'<br />'+data[0].city+', '+data[0].state+' '+data[0].zipcode+'</a></p><hr class="map-popup-hr hr-popup" /><div class = "tech-section"><div class = "technician"><p class = "time-check">TECHNICIAN</p><p class= "view-detail">'+techName+'</p></div><div class = "time-window"><p class = "time-check">TIME WINDOW<p/><p class = "view-detail">'+data[0].jobDetail.period+'</p></div></div><hr class="map-popup-hr hr-popup" /><div><p class = "time-check">OFFICE NOTES<p></div> <p class = "instruct">'+data[0].jobDetail.note +'</p> <div class = "tech-instruction"><p class = "time-check">TECH INSTRUCTIONS</p><p class = "instruct">'+data[0].jobDetail.instruction+'</p></div><button class = "job-map"><a class="h-1x job-one" href="/app/one-time-job/'+data[0].addressId+'/'+data[0].jobDetail.jobId+'">open job</a></button><div class="p-t10" style="text-align: center"><b>'+route.title+'</b></div><div class="p-t10 nearest-location"><a ng-click="showNearestLocation('+data[0].routeId+','+data[0].addressId+','+data[0].latitude+','+data[0].longitude+')">Show Nearest</a>'+moveMethod+'</div></div>';

                                    var content  = $compile(htmlElement)($rootScope);
                                    generateInfoWindow($scope.routeMarkers['_'+route.id][count], route.id, count,  content[0]);
                                    $scope.oms.addMarker($scope.routeMarkers['_'+route.id][count]);                               
                                    count++;   
                                } else {
                                  $rootScope.directionsRenderer['_'+route.id][index].setMap(null);
                                  removeRoute(route.id);
                                  break
                                }                         
                            }

                            if(g_route.legs.length > 0 && route.techId){
                            var techInitial = (route.techFirstname ? route.techFirstname.charAt(0).toUpperCase() : '')+(route.techLastname ? route.techLastname.charAt(0).toUpperCase() : ''); 

                            var icon = {
                                path: 'M 0, 25  a 25,25 0 1,1 50,0 a 25,25 0 1,1 -50,0',
                                scale: 1,
                                strokeWeight: 3,
                                strokeColor: color,
                                strokeOpacity: 1,
                                fillColor: '#fff',
                                fillOpacity: 1,
                                labelOrigin: { x: 25, y: 25},
                            }
                            var labelText = {   
                                text: techInitial,
                                color: color,
                                fontSize: '20px',
                                fontWeight: 'bold'
                            }
                            if(route.userImage){
                                icon = {
                                    url: route.userImage, // url
                                    scaledSize: new google.maps.Size(50, 50), // scaled size
                                    origin: new google.maps.Point(0, 0), // origin
                                    anchor: new google.maps.Point(0, 0) // anchor
                                }
                                labelText = ' ';
                            }                     
                            //$scope.routeMarkers['_'+route.id][count] = new google.maps.Marker(markerOptions); 
                            $scope.routeMarkers['_'+route.id][count] ? $scope.routeMarkers['_'+route.id][count].setMap(null) : ''; 
                            $scope.routeMarkers['_'+route.id][count] = generateMarker(map, origin, '', labelText, icon, color, '');                        
                            var techAddress = isStartPoint ? '<br />'+(route.customStartAddress ? route.customStartAddress.replace(",", "<br />") : '')+'<br />' : '';
                            var content = '<div class="text-center"><b class="h-1x">'+route.techFirstname+' '+route.techLastname+'</b>'+techAddress+'</div>';  
                            generateInfoWindow($scope.routeMarkers['_'+route.id][count], route.id, count, content)
                            //$scope.routeMarkers['_'+route.id][count].setMap(map);
                            $scope.oms.addMarker($scope.routeMarkers['_'+route.id][count]);
                            count++;
                            }
                            if(g_route.legs.length > 0 && !route.techId && isStartPoint){ // Start Point Marker    
                            var labelText = {   
                                text: 'S',
                                color: '#fff',
                                fontSize: '12px'
                            }
                            $scope.routeMarkers['_'+route.id][count] ? $scope.routeMarkers['_'+route.id][count].setMap(null) : '';
                            $scope.routeMarkers['_'+route.id][count] = generateMarker(map, origin, isStartPoint, labelText, icon, color, '');                
                            var content = '<div class="text-center">'+(route.customStartAddress ? route.customStartAddress.replace(",", "<br />") : '')+'<br />'+'</div>';  
                            generateInfoWindow($scope.routeMarkers['_'+route.id][count], route.id, count, content)
                            //$scope.routeMarkers['_'+route.id][count].setMap(map);
                            $scope.oms.addMarker($scope.routeMarkers['_'+route.id][count]);
                            count++;
                            } 
                            $rootScope.routeCache[cacheIndex].directionsRenderer[index].markers = $scope.routeMarkers['_'+route.id];
                            deferred.resolve({error:false, tempAddress,tempAddressIds});
                            //$scope.retry['_'+route.id] = false;
                        }else{
                            
                            var errorMsg = getRoutError(status);  
                            logError({
                                routeId: route.id,
                                origin:origin,
                                destination: destination,
                                waypoints: wayPoints,
                                optimizeWaypoints: optimize,         
                                travelMode: 'DRIVING'}, status, 'Direction API: google.maps.DirectionsService, Method: route')                    
                            deferred.reject({error:{status:true, message:errorMsg, apiStatus : status}});
                        
                            
                        }
                    }
                    if(cachedInfo && cachedInfo.response && cachedInfo.status && !optimize){
                      routeFunction(cachedInfo.response, cachedInfo.status, route);                                              
                    }else{
                        $scope.directionsService.route({
                            origin:origin,
                            destination: destination,
                            waypoints: wayPoints,
                            optimizeWaypoints: optimize,         
                            travelMode: 'DRIVING'
                        }, function(res, code){
                            routeFunction(res, code, route);
                        })
                    }
                    
                }
                return deferred.promise; 
              }       
                  
              var generateAttachedRoute = function(map, route, OrgAddresses, optimize, preserveViewport, indexStart, startAddress, index){
                var addresses = filterValidAdd(route,OrgAddresses);
                var deferred = $q.defer();                                            
                var cacheIndex = "route_"+ route.id + "_" + route.addresses.length;
                var color = route.color;
                var origin=new google.maps.LatLng(startAddress.latitude, startAddress.longitude);                
                var destination = new google.maps.LatLng(addresses[addresses.length-1].latitude, addresses[addresses.length-1].longitude);
                var wayPoints = []; 
                var count = indexStart;   
                var countStatusIcon = indexStart;   
                var isStartPoint = true; 
                var i = isStartPoint?0:1;            
                if(!$rootScope.directionsRenderer['_'+route.id]){
                  $rootScope.directionsRenderer['_'+route.id] = [];
                }
                for (i; i < addresses.length; i++) { 
                    wayPoints.push({
                        location: new google.maps.LatLng(addresses[i].latitude, addresses[i].longitude),
                        stopover: true
                    });  
                }
                if(wayPoints.length > 0 || origin){                     
                    if(!$rootScope.routeCache[cacheIndex].directionsRenderer){
                        $rootScope.routeCache[cacheIndex].directionsRenderer = [];
                    }
                    var cachedInfo = $rootScope.routeCache[cacheIndex].directionsRenderer[index];
                    if(cachedInfo && cachedInfo.ref){
                        $rootScope.directionsRenderer['_'+route.id][index] = cachedInfo.ref;
                    }else{
                        $rootScope.directionsRenderer['_'+route.id][index] = new google.maps.DirectionsRenderer({
                            suppressMarkers: true,
                            polylineOptions: { strokeColor: color },
                            preserveViewport: preserveViewport,
                        });                      
                    }
                    $rootScope.directionsRenderer['_'+route.id][index].setMap(map); 

                    var routeDateExistInActiveDates = function(activeDates, currentDate) {
                      var _markerActiveDates = [];
                      var res = false;
                      if(activeDates && activeDates.length > 0) {
                        activeDates.forEach(function(_date){
                          _date = moment(_date).format('YYYY-MM-DD').toLowerCase();
                          _markerActiveDates.push(_date)
                        })
                      }
                      if (_markerActiveDates.includes(currentDate)) {                        
                        res = true
                      }
                      return res;
                    }

                    var routeFunction = function(response, status, route){  
                        var techName = route.techFirstname ? (route.techFirstname + " " + route.techLastname) : "(None)";
                        //routeDateExistInActiveDates($rootScope.activeDates, route.currentDate) &&                        
                        if(!$rootScope.directionsRenderer['_'+route.id]){
                          $rootScope.directionsRenderer['_'+route.id] = [];
                          $rootScope.directionsRenderer['_'+route.id][index] = new google.maps.DirectionsRenderer({
                            suppressMarkers: true,
                            polylineOptions: { strokeColor: color },
                            preserveViewport: preserveViewport,
                          });
                        }
                        if(!$scope.routeMarkers['_'+route.id]){
                          $scope.routeMarkers['_'+route.id] = [];
                        }
                        if(!optimize){
                          $rootScope.routeCache[cacheIndex].directionsRenderer[index] = {ref : $rootScope.directionsRenderer['_'+route.id][index], response : response, status : status};
                        }else{
                          $rootScope.routeCache[cacheIndex].directionsRenderer[index] = {};
                        }
                        if(response && status == 'OK' && response.routes && response.routes.length > 0){  
                          if(routeDateExistInActiveDates($rootScope.activeDates, route.currentDate)) {
                            $rootScope.directionsRenderer['_'+route.id][index].setDirections(response);                               
                          }else{
                            $rootScope.directionsRenderer['_'+route.id][index].setMap(null);
                            return;
                          }                            
                            //$rootScope.routeCache[cacheIndex].directionsRenderer[index] = {ref : $rootScope.directionsRenderer['_'+route.id][index], response : response, status : status};
                            if(!$rootScope.routeCache[cacheIndex].directionsRenderer[index].markers){
                                $rootScope.routeCache[cacheIndex].directionsRenderer[index].markers = []; 
                            }
                            var g_route = response.routes[0]; 
                            var i = isStartPoint?1:0;
                            
                            var tempAddress = [];      
                            var tempStartAddress = [];
                            var tempAddressIds = [];
                            if(!isStartPoint){
                                tempAddress.push(addresses[0]);
                                tempAddressIds.push(addresses[0].addressId);
                            }
                            
                            angular.forEach(g_route.waypoint_order, function(elementPos, tempIndex){
                            
                                tempAddress.push(addresses[(isStartPoint ? elementPos : elementPos+1)]);
                                tempAddressIds.push(addresses[(isStartPoint ? elementPos : elementPos+1)].addressId);                 
                            });
                            
                            // var totalDuration = 0;
                            // var totalDistance = 0;
                            // angular.forEach(g_route.legs, function(v,k){
                            //     totalDistance = totalDistance + v.distance.value; // distance is in meter
                            //     totalDuration = totalDuration + v.duration.value; // duration is in sec
                            // })
                            
                            // $rootScope.routeDuration[route.id] = {duration : totalDuration, distance : (totalDistance / 1609).toFixed(2) + 'mi'};
                            for (i; i < g_route.legs.length; i++) { 
                                if(routeDateExistInActiveDates($rootScope.activeDates, route.currentDate)) {
                                    var data = tempAddress.filter(function(item, childIndex) { 
                                    var addressIndex = isStartPoint ? childIndex+1 : childIndex;                  
                                    if(i == addressIndex) {                                 
                                        return item;  
                                    }
                                    });       
                                    data[0].routeId = route.id;
                                    var moveMethod = '';
                                    var isStatusMarker = false;
                                    //generate status icon    
                                    $scope.routeMarkers['_'+route.id][count] ? $scope.routeMarkers['_'+route.id][count].setMap(null) : '';
                                    $scope.routeMarkers['_'+route.id][count] = generateMarker(map, new google.maps.LatLng(data[0].latitude, data[0].longitude), isStartPoint, '', '', color, count, data[0]);
                                    $scope.routeMarkers['_'+route.id][count].setMap(map);                     
                                    if(data[0].jobStatusImage){    
                                    isStatusMarker = true;   
                                    } else {
                                    if(data[0].isOneOfJob && data[0].isOneOfJob == 1){
                                        var jobId = data[0].jobId ? data[0].jobId : data[0].oneOfJobId;
                                        moveMethod = '<br /><a ng-click="openMoveAddressPopupFromMarker('+data[0].addressId+','+jobId+ ','+data[0].routeId+')">Move</a>'; 
                                    }else{
                                        moveMethod = '<br /><a ng-click="openMoveAddressPopupFromMarker('+data[0].addressId+','+data[0].id+', '+data[0].routeId+')">Move</a>'; 
                                    }

                                    attachDragMaker($scope.routeMarkers['_'+route.id][count], isStatusMarker,  route.id, countStatusIcon, data[0]);
                                    }
                                    if(!data[0].jobDetail){
                                    data[0].jobDetail = {
                                        period : (data[0].period ? data[0].period : '(None)'),
                                        note : (data[0].note ? data[0].note : '(None)'),
                                        instruction : (data[0].instruction ? data[0].instruction : '(None)')
                                    };
                                    }
                                    data[0].jobDetail.period = data[0].jobDetail.period ? data[0].jobDetail.period : '(None)';
                                    data[0].jobDetail.note = data[0].jobDetail.note ? data[0].jobDetail.note : '(None)';
                                    data[0].jobDetail.instruction = data[0].jobDetail.instruction ? data[0].jobDetail.instruction : '(None)';

                                    /*var htmlElement = '<div class="text-center"><b><a class="h-1x" href="'+(data[0].isPrimary ? '/app/customerdetail/'+data[0].addressId : '/app/locationdetail/'+data[0].addressId)+'">'+data[0].firstName+' '+data[0].lastName+'</a></b><br /><a class="h-1x address-link-map-popup" href="/app/locationdetail/'+data[0].addressId+'">'+data[0].address+'<br />'+data[0].city+', '+data[0].state+' '+data[0].zipcode+'</a><hr class="map-popup-hr" />'+'<div class="p-t10"><a ng-click="showNearestLocation('+data[0].routeId+','+data[0].addressId+','+data[0].latitude+','+data[0].longitude+')">Show Nearest</a>'+moveMethod+'</div></div>';
                                    var content  = $compile(htmlElement)($rootScope);*/
                                    var htmlElement = (!data[0].isOneOfJob || data[0].isOneOfJob == 0) ? '<div class="text-center"><b><a class="h-1x" href="'+('/app/customerdetail/'+(data[0].primaryAddressId))+'">'+data[0].displayName+'</a></b><br /><a class="h-1x address-link-map-popup" href="/app/locationdetail/'+data[0].addressId+'">'+data[0].address+'<br />'+data[0].city+', '+data[0].state+' '+data[0].zipcode+'</a><hr class="map-popup-hr" />'+'<div class="p-t10"><b>'+route.title+'</b></div><div class="p-t10">'+techName+'</div><hr class="map-popup-hr"/><div class="p-t10"><a ng-click="showNearestLocation('+data[0].routeId+','+data[0].addressId+','+data[0].latitude+','+data[0].longitude+')">Show Nearest</a>'+moveMethod+'</div></div>'
                                    :
                                    '<div class="job-container map-view"><b class = "display-name display-name-job-window"><a href="'+('/app/customerdetail/'+(data[0].primaryAddressId))+'">'+data[0].displayName+'</a></b><p class = "address-one address-one-job-window"><a href="/app/locationdetail/'+data[0].addressId+'">'+data[0].address+'<br />'+data[0].city+', '+data[0].state+' '+data[0].zipcode+'</a></p><hr class="map-popup-hr hr-popup" /><div class = "tech-section"><div class = "technician"><p class = "time-check">TECHNICIAN</p><p class= "view-detail">'+techName+'</p></div><div class = "time-window"><p class = "time-check">TIME WINDOW<p/><p class = "view-detail">'+data[0].jobDetail.period+'</p></div></div><hr class="map-popup-hr hr-popup" /><div><p class = "time-check">OFFICE NOTES<p></div> <p class = "instruct">'+data[0].jobDetail.note +'</p> <div class = "tech-instruction"><p class = "time-check">TECH INSTRUCTIONS</p><p class = "instruct">'+data[0].jobDetail.instruction+'</p></div><button class = "job-map"><a class="h-1x job-one" href="/app/one-time-job/'+data[0].addressId+'/'+data[0].jobDetail.jobId+'">open job</a></button><div class="p-t10" style="text-align: center"><b>'+route.title+'</b></div><div class="p-t10 nearest-location"><a ng-click="showNearestLocation('+data[0].routeId+','+data[0].addressId+','+data[0].latitude+','+data[0].longitude+')">Show Nearest</a>'+moveMethod+'</div></div>';
                                    var content  = $compile(htmlElement)($rootScope);
                                    generateInfoWindow($scope.routeMarkers['_'+route.id][count], route.id, count,  content[0]); 
                                    $scope.oms.addMarker($scope.routeMarkers['_'+route.id][count]); 
                                    count++;
                                } else {
                                  $rootScope.directionsRenderer['_'+route.id][index].setMap(null);
                                  removeRoute(route.id);
                                  break
                                }
                            }
                            $rootScope.routeCache[cacheIndex].directionsRenderer[index].markers = $scope.routeMarkers['_'+route.id];
                            deferred.resolve({error:false, tempAddress,tempAddressIds});
                            
                        }else{
                            var errorMsg = getRoutError(status);     
                            logError({
                            routeId: route.id,
                            origin:origin,
                            destination: destination,
                            waypoints: wayPoints,
                            optimizeWaypoints: optimize,         
                            travelMode: 'DRIVING'}, status, 'Direction API: google.maps.DirectionsService, Method: route')                  
                            deferred.reject({error:{status:true, message:errorMsg, apiStatus : status}});
                        }
                    }
                    if(cachedInfo && cachedInfo.response && cachedInfo.status && !optimize){
                        routeFunction(cachedInfo.response, cachedInfo.status, route);
                    }else{
                        $scope.directionsService.route({
                            origin:origin,
                            destination: destination,
                            waypoints: wayPoints,
                            optimizeWaypoints: optimize,         
                            travelMode: 'DRIVING'
                        }, function(res, code){
                            routeFunction(res, code, route);
                        })
                    }

                }
                return deferred.promise; 
              }
              var logError = function(request='', response='', api=''){                
                var postData = {
                  "requestNode":request ? JSON.stringify(request) : '',
                  "responseNode":response ? JSON.stringify(response): '',
                  "api":api
                }     
                apiGateWay.send("/save_logs", postData).then(function(response) { 
                }, function(error) {  
                });
              }  
              var generateInfoWindow = function(marker, routeId, count, content){              
                $scope.infoWindowRoute['_'+routeId] = [];
                google.maps.event.addListener(marker, 'spider_click', function () {  
                  // close window if not undefined     
                  if ($scope.infoWindowRoute['_'+routeId] && $scope.infoWindowRoute['_'+routeId][count] && Object.keys($scope.infoWindowRoute['_'+routeId][count]).length !== 0) { 
                   
                    $scope.infoWindowRoute['_'+routeId][count].close();  
                    $scope.infoWindowRoute['_'+routeId][count] = {}
                  } else {                   
                    $scope.infoWindowRoute['_'+routeId][count] = new google.maps.InfoWindow();
                    $scope.infoWindowRoute['_'+routeId][count].setContent(content);
                    $scope.infoWindowRoute['_'+routeId][count].open($scope.map, marker);                
                  }
                  if($scope.infoWindowRoute['_'+routeId] && $scope.infoWindowRoute['_'+routeId][count] && Object.keys($scope.infoWindowRoute['_'+routeId][count]).length !== 0){
                    google.maps.event.addListener($scope.infoWindowRoute['_'+routeId][count], 'closeclick', function(){                     
                      $scope.infoWindowRoute['_'+routeId][count] = {}
                    });              
                  } 
                });
                
              }       
              /*var generateStatusMarker = function(map, start_location, item=''){   
                var icon = {
                  url: item.jobStatusImage, // url
                  scaledSize: new google.maps.Size(12, 12), // scaled size
                  animation:google.maps.Animation.BOUNCE,
                  anchor: new google.maps.Point(-2, 44)


                }     
                return new google.maps.Marker({
                  position: start_location,
                  icon:icon, 
                  clickable:false,
                  addressId:item?item.addressId:'',
                  routeId:item?item.routeId:'',
                  map: map
                });
              } */
              
              
              var generateMarker = function(map, start_location, isStartPoint, labelText, icon, color, index,item=''){
                var svg = '';      
                svg = item.isOneOfJob==1? $scope.param.svgTemplateJob.replace('{{fillColor}}', color) : $scope.param.svgTemplate.replace('{{fillColor}}', color);
                svg = svg.replace('{{strokeColor}}', '#fff');                
                var iconValue = { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg), labelOrigin: { x: 16, y: 16} };
                if(item.oneOfJobId && item.oneOfJobId > 0){
                  var jobStatus = item.jobDetail && item.jobDetail.jobStatus ? item.jobDetail.jobStatus : 1;
                  item.jobStatusWeb = '';
                }
                
                if(item.jobStatusWeb == 'Completed' || jobStatus == 4){
                  iconValue = { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg.replace('{{statusIcon}}', $scope.param.statusCompleteObject)), labelOrigin: { x: 16, y: 16} };
                }
                if(item.jobStatusWeb == 'No Access' || jobStatus == 2){
                  iconValue = { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg.replace('{{statusIcon}}', $scope.param.statusNoAccessObject)), labelOrigin: { x: 16, y: 16} };
                }
                if(item.jobStatusWeb == 'In Progress' || jobStatus == 3){
                  iconValue = { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg.replace('{{statusIcon}}', $scope.param.statusInProgressObject)), labelOrigin: { x: 16, y: 16} };
                }
                if(item.jobStatusWeb == 'Closed' || jobStatus == 5){
                  iconValue = { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg.replace('{{statusIcon}}', $scope.param.statusClosedObject)), labelOrigin: { x: 16, y: 16} };
                  
                }
                
                if(icon){
                  iconValue = icon;
                }
                var label = {   
                  text: (isStartPoint?index:index+1).toString(),
                  color: '#fff',
                  fontSize: '12px'
                }

                if(labelText){
                  label = labelText
                }
                return new google.maps.Marker({
                  position: start_location,
                  icon: iconValue,
                  label: label,
                  title: '',
                  labelClass: 'label',
                  tech_pay_per_visit: item?item.tech_pay_per_visit:'',
                  time_per_visit:item?item.time_per_visit:'',
                  addressId:item?item.addressId:'',
                  days:item?item.days:[],
                  routeId:item?item.routeId:'',
                  jobStatusImage:item?item.jobStatusImage:'',
                  fillColor:color,
                  strokeColor:'#fff',
                  map: map
                  
                });
              }         

              var chunkArray = function(myArray, chunk_size){
                var results = [];                
                while (myArray.length) {
                    results.push(myArray.splice(0, chunk_size));
                }                
                return results;
              }
              var getRoutError = function(status){
                var errorMsg = '';
                if(status == 'OK'){ //Sometime $rootScope.directionsRenderer[("_" + route.id)][index] is undefined so we want allow to pass setDirection method in undefined variable.
                  errorMsg = '';
                } else if(status == 'NOT_FOUND'){
                  errorMsg ='Property address(es) are not valid for creating map routes.';
                } else if(status == 'ZERO_RESULTS'){
                  errorMsg ='Property address(es) are not valid for creating map routes.';
                }else if(status == 'MAX_WAYPOINTS_EXCEEDED'){
                  errorMsg ='Property address(es) are not valid for creating map routes.';
                }else if(status == 'MAX_ROUTE_LENGTH_EXCEEDED'){
                  errorMsg ='Property address(es) are not valid for creating map routes.';
                }else if(status == 'INVALID_REQUEST'){
                  errorMsg ='Property address(es) are not valid for creating map routes.';
                }else if(status == 'OVER_DAILY_LIMIT'){
                  errorMsg ='Daily limit exceeded';
                }else if(status == 'OVER_QUERY_LIMIT'){
                  errorMsg ='OVER_QUERY_LIMIT';
                }else if(status == 'REQUEST_DENIED'){
                  errorMsg ='Property address(es) are not valid for creating map routes.';
                }else if(status == 'UNKNOWN_ERROR'){
                  errorMsg ='Property address(es) are not valid for creating map routes.';
                } else {
                  errorMsg ='Property address(es) are not valid for creating map routes.';
                }

                return errorMsg;
              }
  
              return {  
                  initAttribute: initAttribute,  
                  mapConfig: mapConfig,  
                  initMap: initMap,  
                  assignMethod: assignMethod  
              }  
            }();  
  
            var init = function () {  
                method.initAttribute();  
                method.assignMethod();  
            }();  
        }  
    };  
})
.filter('convertToDaysInitial', function() {
  return function(text) {
    if( !text.length ) return;
    var weekdays = {
      'monday': 'MON', 'tuesday': 'TUE', 'wednesday': 'WED', 'thursday': 'THU', 'friday': 'FRI', 'saturday': 'SAT', 'sunday': 'SUN'
    }
    if(weekdays[text]) return weekdays[text];
    return text;
  }
})
.filter('convertDateToDaysInitial', function() {
  return function(text) {
    if( !text.length ) return;
    var day = moment(text).format('dddd').toLowerCase();
    var weekdays = {
      'monday': 'MON', 'tuesday': 'TUE', 'wednesday': 'WED', 'thursday': 'THU', 'friday': 'FRI', 'saturday': 'SAT', 'sunday': 'SUN'
    }
    if(weekdays[day]) return weekdays[day];
    return day;
  }
})
.filter('fixedDays', function() {
  return function(days, date) {
    if( !days.length ) return;
    let day = days.find( data => data == date.toLowerCase())
    var weekdays = {
      'monday': 'MON', 'tuesday': 'TUE', 'wednesday': 'WED', 'thursday': 'THU', 'friday': 'FRI', 'saturday': 'SAT', 'sunday': 'SUN'
    }
    if(weekdays[day]) return weekdays[day];
    return day;
  }
})
.filter('pbCapitalize', function() {
  return function(input) {
    return (angular.isString(input) && input.length > 0) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : input;
  }
})
.filter('capitalizeDays', function() {
  return function(input){
    if( !input.length ) return;
    var tempInput = []
    angular.forEach(input, function(item){
      tempInput.push((angular.isString(item) && item.length > 0) ? item.charAt(0).toUpperCase() + item.substr(1).toLowerCase() : item)
    })
    return tempInput.join(', ');
  };
})
.filter('futureDate', function() {
  
  return function(day, date) {
    var pastDate  = moment().subtract(1, 'days');
    var isPastDate = moment(date).isBefore(pastDate); 

    var selectedDate = date ? (isPastDate ? new Date() : date)  : new Date();
  
    if(day){
      var daysIndex = {
        'monday':1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday':6, 'sunday':7
      }    
      var dayINeed = daysIndex[day]; 
      var today = moment(selectedDate).isoWeekday();
      if (today <= dayINeed) { 
        return moment(selectedDate).isoWeekday(dayINeed).format('MMMM DD, YYYY');
      } else {
        return moment(selectedDate).add(1, 'weeks').isoWeekday(dayINeed).format('MMMM DD, YYYY');
      }
    } else {
      return day;
    }
  }
}).directive('pvScrolled', function() {
  return function(scope, elm, attr) {
    var raw = elm[0];
    elm.bind('scroll', function() {
      if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
        scope.$apply(attr.pvScrolled);
      }
    });
  };
}).filter('dateSuffix', function($filter) {
  var suffixes = ["th", "st", "nd", "rd"];
  return function(input) {
    var dtfilter = $filter('date')(input, 'MMMM d');
    var day = parseInt(dtfilter.slice(-2));
    var relevantDigits = (day < 30) ? day % 20 : day % 30;
    var suffix = (relevantDigits <= 3) ? suffixes[relevantDigits] : suffixes[0];
    return dtfilter+suffix;
  };
}).directive('mgminmaxValidator', function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel) {      
      scope.$watch(attrs.ngModel, function(newValue, oldValue) {      
        if (isNaN(newValue)) {
          ngModel.$setViewValue(null);
          ngModel.$render();
        }
      });           
    }
  };
}).directive('stringToNumber', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel) {
      ngModel.$parsers.push(function(value) {
        return '' + value;
      });
      ngModel.$formatters.push(function(value) {
        return parseFloat(value);
      });
    }
  };
}).directive('allowinputonlytwodecimal', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel) {  
      var selected = false;  
      // this.selectionStart = this.selectionEnd;
      element[0].addEventListener('select', function() {
        selected = true;
      }, false);
      element[0].addEventListener('keydown', function() {
        setTimeout(function(){
          selected = false;
        }, 100)
      }, false);
      element.bind('keypress', function(event) {     
        var allowdecimal = element[0].getAttribute('data-allowdecimal') ? element[0].getAttribute('data-allowdecimal') == 'true' : true;
        if(!allowdecimal && event.key == '.') {
          event.preventDefault();
          return false;
        }
        var allowedKeys = ['Backspace', 'Tab', 'End', 'Home', '-', 'ArrowLeft', 'ArrowRight', 'Del', 'Delete'];          
        var _val = Number(element.val());
        var _x = _val.toString();
        if (_x.includes('.')) {
          _x = _x.split('.');
          if (_x.length > 1) {            
            if(_x[1].length > 1){
              if (allowedKeys.indexOf(event.key) !== -1) {
                selected = false;
                return true;
              } else if (selected) {
                selected = false;
                return true;
              }
              else {
                selected = false;
                event.preventDefault();
                return false;
              }
            }
          }   
        }
        return true;
      })
    }
  };
})
.directive('allowTyping', function()  {
	return {
		restrict : 'A',
		link : function(scope, elem, attrs, ctrl) {
      var regex = attrs.allowTyping;
      elem.bind('keypress', function(event) {
        var pos =  event.target.selectionStart;
        var oldViewValue = elem.val();
        var input = newViewValue(oldViewValue, pos, event.key);
    
        var validator = new RegExp(regex);
        if (!validator.test(input)) {
          event.preventDefault();
          return false;
        }
      });
      	function newViewValue(oldViewValue, pos, key) {
  		    if (!oldViewValue) return key;
  		    return   [oldViewValue.slice(0, pos), key, oldViewValue.slice(pos)].join('');
		    } 
		}
		
	
	};
})
.filter( 'range', function() {
  var filter = 
    function(arr, lower, upper) {
      for (var i = lower; i <= upper; i++) arr.push(i)
      return arr
    }
  return filter
})
.filter('mysqlTojsDate', function() {
  return function(mySQLDate, offset) {

    mySQLDate = mySQLDate.replace(/ /g, 'T')
    let tIndex = mySQLDate.indexOf("T");

    if(tIndex == -1) {
      return mySQLDate
    }

    mySQLDate = mySQLDate + "Z"
    return mySQLDate
  }
})
.filter('CFDate', function() {
  return function(jobDate, tempJobId) {
    if(tempJobId.indexOf('CF') == -1 && tempJobId.indexOf('CD') == -1){
      return jobDate
    }
    jobDate = jobDate.split('T')
    jobDate = jobDate[0]
    return jobDate
  }
})
.filter('convertDateOffset', function($filter) {
  return function(date, offset, format) {
      let dateVal = new Date(date);      
      if(offset){
        let offsetVal = offset.split(":");
        dateVal.setUTCHours(dateVal.getUTCHours() + (parseInt(offsetVal[0])));  
      }          
      if(dateVal){
        return $filter('date')(dateVal, format);
      }  
      return date;
    }  
}).directive('focusMe', function($timeout) {
  return {
    scope: { trigger: '=focusMe' },
    link: function(scope, element) {
      scope.$watch('trigger', function(value) {
        if(value === true) { 
          $timeout(function() {
            element[0].focus();
            scope.trigger = false;
          });
        }
      });
    }
  };
})
.directive('autoHeight', function($timeout) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      element.css('overflow', 'hidden');
      var updateHeight = function() {
        element.css('height', 'auto');
        element.css('height', element[0].scrollHeight + 'px');
      };
      element.on('input', function() {
        updateHeight();
      });
      $timeout(function() {
        updateHeight();
      });
      scope.$watch(function() {
        return element.is(':visible');
      }, function(newVal) {
          if (newVal) {
              $timeout(function() {
                  updateHeight();
              });
          }
      });
    }
  };
})
.filter('toHHMMSS', function () {
  return function(sec_num) {
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);
    
    // if(hours > 0){
    //   return seconds > 0 ? (hours + 'hrs ' + minutes + 'min ' + seconds +'secs') : hours + 'hrs ' + minutes + 'min ';
    // }else{
    //   return seconds > 0 ? (minutes + 'min ' + seconds +'secs') : minutes + 'min ';
    // }

    if(hours > 0){
      return hours + 'hr ' + minutes + 'min ';
    }else{
      return minutes + 'min ';
    }
    
  }

})
.filter('convertToMiles', function () {
  return function(meters) {
    return (meters*0.000621371192.toFixed(2)) + ' miles'
  }

})
.directive('preventTyping', function() {
  return function(scope, element, attrs) {
    element.bind('keydown', function(event) {
      event.preventDefault();
    });
  };
})
.directive('datetimepickerDisableDrop', function() {
  return {
    restrict: 'A',
    link: function(scope, element) {
      // Prevent dropping values into the element
      element.on('drop', function(event) {
        event.preventDefault();
      });
    }
  };
})
.directive('infiniteScroll', function() {
  return {
      restrict: 'A',
      link: function(scope, elem, attrs) {
          var raw = elem[0];          
          elem.bind('scroll', function() {
            if (raw.scrollTop + raw.offsetHeight + 1 >= raw.scrollHeight) {
                scope.$apply(attrs.infiniteScroll);
            }
          });
      }
  };
})
.filter('duration', function () {
  return function(duration) {
    
    if(!duration){
      return "0hr 0min";
    }
    if(typeof duration == "object" && !moment(duration, 'HH:MM',true).isValid()){
      return "0hr 0min";
    }
    else if(typeof duration == "object" && moment(duration, 'HH:MM',true).isValid()) {
      duration = moment(duration).format('HH:mm').toString();
    }
    
    var durationParts = duration.split(":");
    if(isNaN(durationParts[0])){
      return "0hr 0min";
    }

    var formatedDuration = parseInt(durationParts[0]) + "hr " + parseInt(durationParts[1]) + "min";
    
    // formatedDuration = parseInt(durationParts[0]) > 1 ? formatedDuration + "hrs " : formatedDuration + "hr ";
    // formatedDuration = formatedDuration + parseInt(durationParts[1]);
    // formatedDuration = parseInt(durationParts[1]) > 1 ? formatedDuration + "mins" : formatedDuration + "min";
    return formatedDuration;
  }

})
.directive('disableScroll', function() {
  return {
      restrict: 'A',
      link: function(scope, element) {
          element.on('wheel', function(event) {
              event.preventDefault();
          });
          element.on('keydown', function(event) {
            if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                event.preventDefault();
            }
        });
      }
  };
})
.directive('onlyNumbersWithDecimal', function () {
  return {
      restrict: 'A',
      link: function (scope, element) {
          element.on('keypress', function (event) {
              let char = String.fromCharCode(event.which);
              let inputValue = element.val();
              let selectionStart = element[0].selectionStart;
              let selectionEnd = element[0].selectionEnd;
              let isAllSelected = selectionStart === 0 && selectionEnd === inputValue.length;

              // Allow numbers, decimal, and minus sign
              if (!char.match(/[0-9.-]/)) {
                  event.preventDefault();
                  return;
              }

              // If all text is selected, allow any valid input
              if (isAllSelected) {
                  return;
              }

              // Prevent multiple decimals
              if (char === '.' && inputValue.includes('.')) {
                  event.preventDefault();
                  return;
              }

              // Allow minus only at the beginning
              if (char === '-' && (inputValue.length > 0 || inputValue.includes('-'))) {
                  event.preventDefault();
                  return;
              }

              // Ensure only two decimal places
              let decimalIndex = inputValue.indexOf('.');
              if (decimalIndex !== -1 && inputValue.length - decimalIndex > 2) {
                  event.preventDefault();
                  return;
              }
          });
      }
  };
});
/* Directive Ends */
