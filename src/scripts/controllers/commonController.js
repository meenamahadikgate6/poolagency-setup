angular.module('POOLAGENCY')

.controller('headerController', function($scope, $rootScope, $templateCache, auth, apiGateWay, config,$window,configConstant, $state, ngDialog, $stateParams, $filter, companyService, pendingRequests, $timeout) {
    $scope.isBundleSearch = false;
    $scope.bundleList = [];
    $scope.selectedCustomerForJob = null;  
    $scope.addressId = "";
    $scope.completeAddress ="";
    $scope.loadingCustomerApi;
    $rootScope.eqTempelateId = null;
    $scope.hoverProfile = false;
    $rootScope.useProdDb = false;
    var currEnvironment = configConstant.currEnvironment;   
    $scope.reportSectionOn = configConstant[currEnvironment].REPORT_SECTION;
    $scope.isRoutingSection = configConstant[currEnvironment].isRoutingSection
    var session = auth.getSession();
    $rootScope.userSession = session;
    $rootScope.searchListCustomer = [];
    $rootScope.currentProductAccount = "--";
    $rootScope.currentRefundAccount = "--";

    $scope.date = new Date();
    $scope.dueDate = new Date();
    $scope.invoiceType = 'OneOffJob';
    $scope.billingSetting = true;
    $rootScope.actionPerformed = '';
    $rootScope.isCustomerSearch = false;
    $scope.config = configConstant;
    $scope.pendingRequests = pendingRequests;
    $rootScope.isProductPopupSearching = false;
    $rootScope.selectedCustomerNew = null;
    
    $rootScope.setActionPerformed = function(action,p1,p2,p3) {
        $scope.isActionPerformed = true;
        $rootScope.dayName = p1 ? p1.slug : null;
        $rootScope.waterBodyName = p1 ? p1 : null;
        $rootScope.waterBodyServiceLevel = p2 ? p2 : null;
        $rootScope.changed_products_services_index = p3;
        $rootScope.actionPerformed = action;
    }
    $rootScope.canAddProductToBundle = function(data, totalAmount, _errVar) {
      let success = false;
      let totalCheck = 0;
      if (data.bundleItemReference && data.bundleItemReference.length > 0) {
          let total = 0;
          angular.forEach(data.bundleItemReference, function(item){
              total += parseFloat(item.qty) * String(item.price).match(/(\d+)(\.\d+)?/g);
          });
          totalCheck = totalAmount + total;
      } else {
          totalCheck = totalAmount + data.price;
      }
      if (totalCheck < 0) {          
          $scope[_errVar] = "The invoice total can't be less than $0.00";
          setTimeout(function() {
            $scope[_errVar]  = "";
        }, 2000);
      } else {
          success = true;
      }
      return success
    }
    $rootScope.negativeCheckPassed = function(product) {
      let checkPassed = false;
      if (product && product.length > 0) {
          let totalCheck = 0;
          angular.forEach(product, function(value, key) {
              product[key].qty = parseFloat(value.qty);
              if((value.category == "Bundle" || value.category == "bundle")){
                  var bundleItemTotal = 0;
                  angular.forEach(value.bundleItemReference, function(v, k) {
                      var pfmt = (typeof v.price === "number") ? v.price : parseFloat(v.price.replace(/[^0-9.-]/g, ''));
                      bundleItemTotal = bundleItemTotal + $rootScope.negativeRoundUp(pfmt*(v.qty));                    
                      product[key].price = bundleItemTotal;
                  });
                  
                  var frmt = (typeof product[key].price === "number") ? product[key].price : parseFloat(product[key].price.replace(/[^0-9.-]/g, ''));
                  bundleItemTotal = frmt;
                  bundleItemTotal = $rootScope.negativeRoundUp(bundleItemTotal *(value.qty));
                  totalCheck = totalCheck + bundleItemTotal;
              } else {
                  var pfmt = (typeof value.price === "number") ? value.price : parseFloat(value.price.replace(/[^0-9.-]/g, ''));
                  totalCheck = totalCheck + $rootScope.negativeRoundUp(pfmt*(value.qty));
              }
          });
          checkPassed = (totalCheck < 0) ? false : true;
      }
      return checkPassed;
    }
    $rootScope.getShortLastNames = function(data) {
      return data.map(function(item) {
          // Check if actionBy is not -1 or not -3 and lastName is present
          if ((item.actionBy !== -1 || item.actionBy !== -3) && item.lastName) {
              item.lastName = item.lastName.charAt(0).toUpperCase() + '.';
          }
          return item;
      });
    }
    // format tech name as first name and last name initial
    $rootScope.getTechNameFormated = function(item) {
      let formated = item.firstName + ' ' + (item.lastName ? item.lastName.charAt(0).toUpperCase() + '.' : '');
      return formated;
    }
  // sort selected items to top
  $rootScope.sortItemToTop = function (items, targetId) {
    // Find the index of the target item
    const targetIndex = items.findIndex(item => item.id === targetId);
    // If the target item is found and not already at the top
    if (targetIndex > 0) {
      // Remove the target item from its current position
      const [targetItem] = items.splice(targetIndex, 1);

      // Insert it at the beginning of the array
      items.unshift(targetItem);
    }
    return items;
  }
  // normalize cover photos to set only one itam as cover photo
  $rootScope.normalizeCoverPhotos = function(mediaArray) {
    let foundFirst = false;
    return mediaArray.map(item => {
        if (item.isCoverPhoto === 1) {
            if (!foundFirst) {
                foundFirst = true;
                return item; // Keep the first cover photo as is
            }
            return { ...item, isCoverPhoto: 0 }; // Reset others to 0
        }
        return item;
    });
  }
    $rootScope.techPayrollId = null;
    $rootScope.validateBlankQtyInput = (d,type) => {
      if (type== 'price') {                
          if (isNaN(d.price) || d.price == undefined || d.price == '' || d.price < 0) {
              d.price = 0
          }
      }
      if (type== 'qty') {                
          if (isNaN(d.qty) || d.qty == undefined || d.qty == '' || d.qty < 0.1) {
              d.qty = 1
          }
      }
    }
    $rootScope.validateBlankQtyInputNegative = (d,type) => {
      if (type== 'price') {                
          if (isNaN(d.price) || d.price == undefined || d.price == '') {
              d.price = 0
          }
      }
      if (type== 'qty') {                
          if (isNaN(d.qty) || d.qty == undefined || d.qty == '') {
              d.qty = 1
          }
      }
    }
    $rootScope.currencyTrimmer = function(c) {
      var finalValue = c;
      if (c) {
          c = Number(c);
          finalValue = Number(Math.round(finalValue * 1000) / 1000)
          finalValue = Number(Math.round(finalValue * 100) / 100)
      }
      return finalValue;
    }
    $rootScope.negativeRoundUp = function(n = 0) {
      return parseFloat(Math.round((Math.round(n * 1000) / 1000) * 100) / 100);
    }
    $rootScope.getFileNameForUpload = function(name='') {
      let fileName = '';
      name = name.replace(/[^a-zA-Z0-9.\-_]/g, '');
      let nameArr = name.split('.');
      let extension = nameArr.pop();
      let _name = nameArr.join('_');
      fileName = _name + '_' + new Date().getTime();
      return fileName;
    }
    // etract file Name from URL
    $rootScope.extractFileNameFromURL = function(url) {
      if (url) {
          const parsedUrl = new URL(url);
          return parsedUrl.pathname.split('/').pop(); // Get the file name from the pathname
      } else {
          return url;
      }
    }
    $rootScope.updateTimeStamp = function(fullName, index) {            
      const fileNameParts = fullName.split('_');
      const lastPart = fileNameParts.pop();
      const timestamp = new Date().getTime() + index;
      return fileNameParts.join('_') + '_' + timestamp;
    }
    $rootScope.renameOriginalFile = function(originalStr, index) { 
      var parts = originalStr.split('.');
      var extension = '.' + parts.pop();
      var base = parts.join('.');
      var filename = base.split('/').pop();        
      var renamedStr = $scope.updateTimeStamp(base, index) + extension;
      return renamedStr;
    }
    $rootScope.getTemporaryPath = function() {
      var possible = '0123456789012345678901234567890123456789';
      var result = '';
      for (var i = 15; i > 0; --i) {
          result += possible[Math.floor(Math.random() * possible.length)];
      }
      return 'xtemp_' + result + new Date().getTime() + '_tempx';
    }
    $scope.galleryPhotos = [];
    $scope.imageInitialIndex = 0;
    $rootScope.showImageSlides = function(index, photosArr){  
      if (photosArr.length) {
            angular.forEach(photosArr, function(photo, index) {
              photo.fullPath = photo.mediaPath;
          });
      }        
      $scope.galleryPhotos = photosArr;
      $(document).bind('keydown', function (e) {
          var ele = document.getElementsByClassName("full-screen-gallery");
          if(ele.length == 0) return;
          var carouselPrev = document.getElementsByClassName("carousel-prev");
          var carouselNext = document.getElementsByClassName("carousel-next");
          switch (e.key) {
              case 'ArrowLeft':
                  carouselPrev[carouselPrev.length-1].click();
                  break;
              case 'ArrowRight':
                  carouselNext[carouselNext.length-1].click();
          }
      });
      $scope.imageInitialIndex = index;
      ngDialog.open({
          template: 'fullScreenPictureGallery.html',
          className: 'ngdialog-theme-default',
          scope: $scope,
          preCloseCallback: function() {
              $scope.imageInitialIndex = 0;
              $scope.galleryPhotos = [];
          }
      });
    }
    $scope.hoverProfileFn = function(v) {
        $scope.hoverProfile = (v == undefined) ? $scope.hoverProfile : true;
        $scope.hoverProfile = ($scope.hoverProfile == true) ? false : true;
    };
    var link = document.getElementById('chargebee-manageaccount');
    
    $rootScope.openChargeBee = function(){
      //[Rajendra] : Check company subscription exists
      //If yes, open manage popup
      //if no open checkout
      $scope.hoverProfile =  false;
      $scope.isProcessing = true;      
      apiGateWay.get("/administrator/company_details", {companyId: session.companyId}).then(function(response) {
          $scope.isProcessing = false;
          if(response.data.status == 200){
              var responseData = response.data.data;
              var companyData = responseData.companyInfo;
              if(companyData.customer_id && companyData.subscription_id){
                session['custId'] = companyData.customer_id;
                auth.setSession(session);
                $rootScope.clickCBLink();
              }else{
                document.getElementById('chargebee-plan').click();
              }
          }
      },function(errorResponse){
          $scope.isProcessing = false;
          $scope.clickCBLink();
      });
    }
    
    $rootScope.clickCBLink = function(){
        var chargebeeInstance = window.Chargebee.getInstance();
        $scope.hoverProfile =  false;
        if(session && session.custId){
            var custId = session.custId;
            var errmsg = custId + ' not found';
            chargebeeInstance.setPortalSession(function(){
                return apiGateWay.send("/create_portal_session",{customer_id: custId}).then(function(response) {
                    var responseData = response.data;                   
                    if(responseData.message && responseData.message == errmsg){
                      setTimeout(function(){document.getElementById('chargebee-plan').click();},1000);                                                                
                    }
                    return responseData.data;
                 },function(errorResponse) {
                  if(errorResponse == errmsg){
                    setTimeout(function(){document.getElementById('chargebee-plan').click();},1000);                                                                
                  }      
                });
          }); 
        }else{
            var link = document.getElementById('chargebee-manageaccount');
            link.click();
        }
        
    
        var cbPortal = chargebeeInstance.createChargebeePortal();
        cbPortal.open({
          close: function() {
            //close callbacks
          }
        });
    }

    $rootScope.openChargeBeeSAdmin = function(){
      //[Rajendra] : Check company subscription exists
      //If yes, open manage popup
      //if no open checkout
      $scope.hoverProfile =  false;
      $scope.isProcessing = true;
      var sAdminCompanyId = $rootScope.selectedCompany; 
      if(sAdminCompanyId == ''){
        sAdminCompanyId = session.companyId;
      }
      apiGateWay.get("/administrator/company_details", {companyId: sAdminCompanyId}).then(function(response) {
          $scope.isProcessing = false;
          if(response.data.status == 200){
              var responseData = response.data.data;
              var companyData = responseData.companyInfo;
              if(companyData.customer_id && companyData.subscription_id){
                session['custId'] = companyData.customer_id;
                auth.setSession(session);
                $rootScope.clickCBLinkSAdmin();
              }else{
                document.getElementById('chargebee-plan').click();
              }
          }
      },function(errorResponse){
          $scope.isProcessing = false;
          $scope.clickCBLinkSAdmin();
      });
    }

    $rootScope.clickCBLinkSAdmin = function(){
        var chargebeeInstance = window.Chargebee.getInstance();
        $scope.hoverProfile =  false;
        if(session && session.custId){
            var custId = session.custId;
            var errmsg = custId + ' not found';
            chargebeeInstance.logout();
            chargebeeInstance.setPortalSession(function(){
                return apiGateWay.send("/create_portal_session",{customer_id: custId}).then(function(response) {
                    var responseData = response.data;                   
                    if(responseData.message && responseData.message == errmsg){
                      setTimeout(function(){document.getElementById('chargebee-plan').click();},1000);                                                                
                    }
                    return responseData.data;
                },function(errorResponse) {
                  if(errorResponse == errmsg){
                    setTimeout(function(){document.getElementById('chargebee-plan').click();},1000);                                                                
                  }      
                });
          }); 
        }else{
            var link = document.getElementById('chargebee-manageaccount');
            link.click();
        }
        
    
        var cbPortal = chargebeeInstance.createChargebeePortal();
        cbPortal.open({
          close: function() {
            //close callbacks
          }
        });
    }
    
    $scope.editAlertPermission = session.editAlertPermission;
    $scope.viewTechnicianPay = session.viewTechnicianPay;
    $scope.canDeleteJobs = session.canDeleteJobs;
    $scope.canCreateInvoice = session.canCreateInvoice;
    $scope.canEditInvoice = session.canEditInvoice;
    $scope.canDeleteInvoice = session.canDeleteInvoice;
    $scope.canEditReadings = session.canEditReadings;
    $scope.loggedInRole = auth.loggedInRole();
    $scope.wrapperClass = function() {
      if ($rootScope.currentState == 'alertpopout') {
            return 'alert-wrapper';
        }
        if ($rootScope.currentState == 'technicianroute') {
          return 'technician-route-wrapper';
      }
        return '';
    };
    if($scope.loggedInRole == 'companyadmin' && !session.isCompanyHasFullSignUp){
        $scope.loggedInRole = 'user';
    }

    if($scope.loggedInRole == 'administrator' && config.currentEnvironment.text == 'Staging'){
        // apiGateWay.get("/administrator/database").then(function(response) {
        //     if (response.data.status == 200) {
        //         $rootScope.useProdDb = (response.data.data.replace(/(\r\n\t|\n|\r\t)/gm,"")) == 'STAGE' ? false : true;
        //     }
        // }, function(error) {
        // });
      }
    $scope.customerSearchTemplate = `    
          <table class="auto-complete" style="" ng-click="fullScreenSearchBoxClose()">
            <tbody ng-if="!item.isOneOfJob" class="1">
              <tr>
                <td
                  style="width:55%"
                  ng-if="item.isPrimary==1"
                  ui-sref="app.customerdetail({addressId: item.addressId})"
                >
                  {{isNumeric}}
                  <span
                    class="hightLight"
                    ng-bind-html="item.fullName | highlight: item.searchKey"
                  ></span>
                </td>
                <td
                  style="width:55%"
                  ng-if="item.isPrimary==0"
                  ui-sref="app.locationdetail({addressId: item.addressId})"
                >
                  {{isNumeric}}
                  <span
                    class="hightLight"
                    ng-bind-html="item.fullName | highlight: item.searchKey"
                  ></span>
                </td>
                <td
                  ng-if="item.jobId && item.searchNumeric && item.jobId.toString().includes(item.searchKey.toString())"
                  style="float:right"
                >
                  (<a
                    href="javascript:void(0)"
                    ui-sref="app.customerjobdetail({addressId: item.addressId, jobId: item.jobId})"
                  >
                    #
                    <span
                      class="hightLight"
                      style="font-size:12px;color:#444;font-weight:400"
                      ng-bind-html="item.jobId | highlight: item.searchKey"
                    ></span> </a
                  >)
                </td>
              </tr>
              <tr>
                <td
                  colspan="2"
                  ng-if="item.isPrimary==1"
                  ui-sref="app.customerdetail({addressId: item.addressId})"
                >
                  <span
                    class="hightLight"
                    style="font-size:12px;color:#444;font-weight:400"
                    ng-bind-html="item.fullAddress | highlight: item.searchKey"
                  ></span>
                </td>
                <td
                  colspan="2"
                  ng-if="item.isPrimary==0"
                  ui-sref="app.locationdetail({addressId: item.addressId})"
                >
                  <span
                    class="hightLight"
                    style="font-size:12px;color:#444;font-weight:400"
                    ng-bind-html="item.fullAddress | highlight: item.searchKey"
                  ></span>
                </td>
              </tr>
            </tbody>
            <tbody ng-if="item.isOneOfJob && item.jobId && item.jobId != null" class="2">
              <tr>
                <td
                  style="width:55%"
                  ng-if="item.isPrimary==1"
                  ui-sref="app.customerdetail({addressId: item.addressId, jobId: item.jobId})"
                >
                  {{isNumeric}}<span
                    class="hightLight"
                    ng-bind-html="item.fullName | highlight: item.searchKey"
                  ></span>
                </td>
                <td
                  style="width:55%"
                  ng-if="item.isPrimary==0"
                  ui-sref="app.locationdetail({addressId: item.addressId, jobId: item.jobId})"
                >
                  {{isNumeric}}<span
                    class="hightLight"
                    ng-bind-html="item.fullName | highlight: item.searchKey"
                  ></span>
                </td>
                <td
                  ng-if="item.jobId && item.searchNumeric && item.jobId.toString().includes(item.searchKey.toString())"
                  style="float:right"
                >
                  (<a
                    href="javascript:void(0)"
                    ui-sref="app.onetimejob({addressId: item.addressId, jobId: item.jobId})"
                    >#<span
                      class="hightLight"
                      style="font-size:12px;color:#444;font-weight:400"
                      ng-bind-html="item.jobId | highlight: item.searchKey"
                    ></span></a
                  >)
                </td>
              </tr>
              <tr>
                <td
                  colspan="2"
                  ng-if="item.isPrimary==1"
                  ui-sref="app.customerdetail({addressId: item.addressId, jobId: item.jobId})"
                >
                  <span
                    class="hightLight"
                    style="font-size:12px;color:#444;font-weight:400"
                    ng-bind-html="item.fullAddress | highlight: item.searchKey"
                  ></span>
                </td>
                <td
                  colspan="2"
                  ng-if="item.isPrimary==0"
                  ui-sref="app.locationdetail({addressId: item.addressId, jobId: item.jobId})"
                >
                  <span
                    class="hightLight"
                    style="font-size:12px;color:#444;font-weight:400"
                    ng-bind-html="item.fullAddress | highlight: item.searchKey"
                  ></span>
                </td>
              </tr>
            </tbody>
          </table>  
    `;
    $scope.customerName = '';
    $scope.isNumeric = false;
    var customerSearchLimit  = 500;
    $scope.autoCompleteOptions = {
          minimumChars: 3,
          maxItemsToRender: customerSearchLimit,
          containerCssClass: 'color-codes global-search-container',
          selectedTextAttr: 'name',
          itemTemplate : $scope.customerSearchTemplate,
          data: function (searchText) {
                searchText = searchText.replace('  ', ' ');
                var isSearchQueryIsNumeric = !isNaN(searchText);
                var isSearchQueryIsAlphaNumeric = isNaN(searchText);
                return apiGateWay.get("/search_customers", {offset: 0, limit: customerSearchLimit, searchKey: searchText, isGroupByAddress: true, isJobSearchable: true}).then(function(response) {
                        var responseData = response.data.data.data;
                        var result;                        
                        // 
                        if (isSearchQueryIsAlphaNumeric && response.data.data.data.length > 0) {  
                          var map = new Map;                         
                          var filtered = [];
                          response.data.data.data.forEach(function (item) {
                            var index = map.get(item.addressId);
                            if (index === undefined) {
                                map.set(item.addressId, filtered.push(item) - 1);
                                return;
                            }
                            if (filtered[index].Status < item.Status) {
                                filtered[index] = item;
                              }
                          });    
                          result = filtered;                              
                        }  
                        // 
                        if (isSearchQueryIsNumeric && response.data.data.data.length > 0) {
                          var map = new Map;
                          var filtered = [];
                          filtered = response.data.data.data;
                          // again filter
                          var _filtered = []
                          filtered.forEach(function(v){ 
                            if (v.jobId) {
                              if (v.jobId.toString().includes(searchText.toString())) {
                                _filtered.push(v)
                              } else if (v.fullName.toString().includes(searchText.toString()) || v.fullAddress.toString().includes(searchText.toString())) {
                                let _v = _filtered.find(x => x.addressId === v.addressId)
                                if(_v) {
                                  
                                } else {
                                  _filtered.push(v)
                                }
                              }
                            } else {
                              _filtered.push(v)
                            }

                          })
                          result = _filtered;
                          }
                        // 
                        if (response.data.status == 200) {
                          return result;
                        }
                },function(errorResponse) {

                });
          },
          itemSelected: function (e) {
              $scope.customerName = searchText;
          }
      }

    $scope.highLightAddress = function(text){
        alert(text);
        // if (phrase) text = text.replace(new RegExp('('+phrase+')', 'gi'), '<span class="highlighted">$1</span>')
        // return text;
    }
    $rootScope.isFullScreenSearchBoxOpen = false;
    $rootScope.closeisFullScreenSearchBox = () => {
      var searchEle = angular.element(document.querySelector('.pb-app .customer-search-close'));
      if (searchEle) {
        setTimeout(function(){
          searchEle.triggerHandler('click');                
          })
        }
    };
    $rootScope.getCrmStatus = function(){      
      $rootScope.crmStatus = {};
      $rootScope.qbConnectedNow = false;
      var custId = '';
      var session = auth.getSession();
        if(session && session.userId){
            custId = session.userId;
            companyId = session.companyId;
            $rootScope.isCompanyHasFullSignUp = session.isCompanyHasFullSignUp;
            if(companyId){
              apiGateWay.get("/company/crm_status",{companyId: companyId}).then(function(response) {
                var responseData = response.data;
                if (responseData.status == 200) {
                  $rootScope.crmStatus = responseData.data;
                  if($rootScope.crmStatus.quickBook && $rootScope.crmStatus.quickBook.qbConnection==1){
                    $rootScope.qbConnectedNow = true;
                  }
                  if($rootScope.currentState == 'app.companysettings' || $rootScope.currentState == 'administrator.settings'){
                    setTimeout(function(){
                      try {
                        $scope.getIncomeAccount();
                        $scope.getIncomeAccountDetails();
                      } catch (error) {
                      }
                    }, 1000);
                  }
                }
                $rootScope.settingPageLoaders.qboSection.qboConnected = false;
              },function(errorResponse) {
                $rootScope.settingPageLoaders.qboSection.qboConnected = false;
              });
            }
        }
    }

     $rootScope.$watch('crmStatus', function(newValue) {
          if (newValue && Object.keys(newValue).length > 0) {
             
              // Wait for DOM rendering to ensure the custom element exists
              $timeout(function() {
                  const qbStatusElement = document.querySelector('app-qb-status');
                  if (qbStatusElement) {
                      qbStatusElement.crmstatus = newValue; // Set crmStatus property
                  }
              }, 500);
          }
      });
      
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            const qbStatusElement = document.querySelector('app-qb-status');
            if (qbStatusElement) {
                console.log('Element found, adding event listener...');
                
                // Remove existing listener to prevent duplicates
                qbStatusElement.removeEventListener('passData', handlePassData);
                qbStatusElement.addEventListener('passData', handlePassData);
    
                observer.disconnect(); // Stop observing once found
            } else {
                console.warn('app-qb-status not found yet.');
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

      function handlePassData(event) {
        debugger;
        $scope.$apply(function() {
            console.log('Received data: 3', event.detail);
            // $scope.crmStatus = event.detail; // Store data in AngularJS scope
        });
    }

    //   document.addEventListener("DOMContentLoaded", function() {
    //     const qbStatusElement = document.querySelector('app-qb-status');
    //     if (qbStatusElement) {
    //         qbStatusElement.addEventListener('dataEmitter', function(event) {
    //             console.log('Received data:', event.detail);
    //         });
    //     }
    // });


    $rootScope.incomeAccountDetails = [];
    $scope.initiatedIncomeAccounts = false;
    $rootScope.isQboItemsSyncEnabled = null;
    $rootScope.isQBODeptSyncEnabled = null;
    $rootScope.isHeritageEnabled = false;
    $scope.getIncomeAccount = function(){  
      $rootScope.settingPageLoaders.qboSection.accountV1 = true;    
      apiGateWay.get('/accounts_list', {}).then(function(response){        
        if(response.data.status == 200){
          $scope.initiatedIncomeAccounts = true;
          $rootScope.incomeAccountDetails = response.data.data;
          angular.forEach( $rootScope.incomeAccountDetails.accountsDataForProduct, function(item){   
               if($rootScope.incomeAccountDetails.currentProductAccount == item.accountId){
                  $rootScope.currentProductAccount = item.accountName;
               }
               $rootScope.selectedIncomeAccountId = item.accountId;
               $rootScope.accountsDataForProductAccountName = item.accountName;
          });
          angular.forEach( $rootScope.incomeAccountDetails.accountsDataForRefund, function(item){ 
            if($rootScope.incomeAccountDetails.currentRefundAccount == item.accountId){
               $rootScope.currentRefundAccount = item.accountName;
            }
            $rootScope.selectedIncomeRefundAccountId = item.accountId;
            $rootScope.accountsDataForRefundAccountName = item.accountName;
          });
          $rootScope.qboSyncEnabled = $rootScope.incomeAccountDetails.qboSyncEnabled
          $rootScope.isQboItemsSyncEnabled = $rootScope.incomeAccountDetails.isQboItemsSyncEnabled ? $rootScope.incomeAccountDetails.isQboItemsSyncEnabled : 0;
          $rootScope.isQBODeptSyncEnabled = $rootScope.incomeAccountDetails.isQBODeptSyncEnabled ? $rootScope.incomeAccountDetails.isQBODeptSyncEnabled : 0;
          $rootScope.isHeritageEnabled = $rootScope.incomeAccountDetails.isCompanyHeritageEnabled ? $rootScope.incomeAccountDetails.isCompanyHeritageEnabled : false;
        }else{
          
        }
        $rootScope.settingPageLoaders.qboSection.accountV1 = false;
      }, function(error){
        $rootScope.settingPageLoaders.qboSection.accountV1 = false;
        $scope.quick_book_error = error;
        if (typeof resetMessage === "function") {
          resetMessage()
        }
      })
    }
    
    $scope.getIncomeAccountDetails = function(){
      $rootScope.settingPageLoaders.qboSection.accountV2 = true;
      apiGateWay.get('/accounts_list_V2', {}).then(function(response){          
        if(response.data.status == 200){
          $rootScope.IncomeAccountDetails = response.data.data;  
          angular.forEach( $rootScope.incomeAccountDetails.incomeAccountsData, function(item){
            
          })
  
        }else{
          
        }
        $rootScope.settingPageLoaders.qboSection.accountV2 = false;
      }, function(error){
        $rootScope.settingPageLoaders.qboSection.accountV2 = false;
        $scope.quick_book_error = error;
        if (typeof resetMessage === "function") {
          resetMessage()
        }
      })
    }
    //$rootScope.getCrmStatus();
    //One Time Job 
    $rootScope.isCreateJobPopupIsOpen = false;
    $scope.createJobModal = function() {
      $scope.customerName = '';
      $scope.selectedCustomerForJob = null;
      $rootScope.selectedCustomerNew = null; 
      $rootScope.searchCustomerPayload.searchKey = '';
      $rootScope.searchListCustomer = [];
      $rootScope.isCreateJobPopupIsOpen = true;
      ngDialog.open({
            template: 'createJob.html',
            className: 'ngdialog-theme-default v-center',
            scope: $scope,
            preCloseCallback: function (){
              $rootScope.isCreateJobPopupIsOpen = false;
            }
      });
      setTimeout(function() {
        angular.element("#newJobPopupInput").focus();
      }, 800); 
    }

    //Invoice Modal 
    var userSession = auth.getSession()
    $rootScope.userCanCreateInvoice = (userSession.userType == "administrator" ? 1 : (userSession.canCreateInvoice ? userSession.canCreateInvoice : 0));
    $scope.createInvoiceModal = function() {
      if ($rootScope.userCanCreateInvoice == 0) {  
        $rootScope.showMsgCantCreateInvoice();      
        return
      }
      $scope.customerName = '';
      $scope.selectedCustomerForJob = null; 
      apiGateWay.get("/company_billing_settings").then(function(response) {
          if (response.data.status == 200) {
            if(response.data.data){  
              $scope.billingSetting = response.data.data.activateBilling
            }
            if($scope.billingSetting) {
              $scope.createInvoice($scope)
            } else  {
              $scope.showMsg($scope)
            } 
          } else {
            $scope.createInvoice($scope)
          }
      },function(error){
        $scope.createInvoice($scope)
      })
    }

    $scope.createQuotesModal = function() {
      $scope.createQuotes($scope)
      // $scope.selectedCustomerForJob = null; 
      // apiGateWay.get("/company_billing_settings").then(function(response) {
      //     if (response.data.status == 200) {
      //       if(response.data.data){  
      //         $scope.billingSetting = response.data.data.activateBilling
      //       }
      //       if($scope.billingSetting) {
      //         $scope.createQuotes($scope)
      //       } else  {
      //         $scope.showMsg($scope)
      //       } 
      //     } else {
      //       $scope.createQuotes($scope)
      //     }
      // },function(error){
      //   $scope.createQuotes($scope)
      // })
    }

    $rootScope.isCreateQuotePopupIsOpen = false;
    $scope.createQuotes = function($scope){
      $rootScope.isCreateQuotePopupIsOpen = true;
      $rootScope.selectedCustomerNew = null; 
      $rootScope.searchCustomerPayload.searchKey = '';
      $rootScope.searchListCustomer = [];
      ngDialog.open({
        template: 'createQuotes.html',
        className: 'ngdialog-theme-default v-center',
        scope: $scope,
        preCloseCallback: function (){
          $rootScope.isCreateQuotePopupIsOpen = false;
        }
      });  
      setTimeout(function() {
        angular.element("#newQuotePopupInput").focus();
      }, 800); 
    }

    $scope.createNewQuote = function(){
      ngDialog.close();
      let addressId = $rootScope.selectedCustomerNew.addressId;
      if (addressId) {
        let postData= {
          "id":'',
          "customerId": $rootScope.selectedCustomerNew.customerId,
          "addressId": addressId,
          "bodyOfWater": "",
          "title":"",
          "notes":"",
          "quoteDate":"",
          "duration":"",
          "subTotal": 0,
          "taxTitle": "",
          "taxValue": 0.00,
          "taxPercentValue": 0.00,
          "discountTitle": "",
          "discountValue": 0.00,
          "total": 0.00,
          "status":"Open",
          "statusNote":"",
          "quoteUrl":"",
          "productItemReference":[],
          "technicianId": ""
      }
      apiGateWay.send("/quotes", postData).then(function(response) {
          if (response.status == "200"){ 
            let quoteId = response.data.data.transactionId;     
            $state.go("app.customerquotesdetail",{"quoteId":quoteId}, {reload: true});            
          } else {     
              $scope.errorBottom = response.data.message;
              $scope.scrollToError('#bottom-section-error')
              setTimeout(function() {
                  $scope.errorBottom = '';
                  if (!$scope.$$phase) $scope.$apply()
              }, 3000);
          }         
          $scope.isProcessing = false; 
          
      }, function(error){
          $scope.errorBottom = error;
          $scope.scrollToError('#bottom-section-error')
          setTimeout(function() {
              $scope.errorBottom = '';
              if (!$scope.$$phase) $scope.$apply()
          }, 3000);
          $scope.isProcessing = false; 
      })
        $scope.isProcessing = false;
        $rootScope.selectedCustomerNew = null;
      }
}
    $rootScope.isCreateInvoicePopupIsOpen = false;
    $scope.createInvoice = function($scope){
      $rootScope.isCreateInvoicePopupIsOpen = true;
      $rootScope.selectedCustomerNew = null; 
      $rootScope.searchCustomerPayload.searchKey = '';
      $rootScope.searchListCustomer = [];
      ngDialog.open({
        template: 'createInvoice.html',
        className: 'ngdialog-theme-default v-center',
        scope: $scope,
        preCloseCallback: function (){
          $rootScope.isCreateInvoicePopupIsOpen = false;
        }
      }); 
      setTimeout(function() {
        angular.element("#newInvoicePopupInput").focus();
      }, 800); 
    }
    $scope.showMsg = function($scope){
      ngDialog.open({
        template: 'showMsg.html',
        className: 'ngdialog-theme-default v-center',
        scope: $scope,
      });  
    }
    $rootScope.showMsgCantCreateInvoice = function(){
      ngDialog.open({
        template: 'canNotCreateInvoiceMsg.html',
        className: 'ngdialog-theme-default v-center',
        scope: $scope,
      });  
    }
  
    $scope.closeJob = function(){
      ngDialog.close();
      $scope.selectedCustomerForJob = null;
      $rootScope.selectedCustomerNew = null;
    }
  
    $scope.selectCustomer = function(customer){
      $scope.selectedCustomerForJob = customer;
      $scope.searchText = "";
      $scope.isCustomerSearch = "";
      
      angular.forEach(customer.addressList, function(item, index){            
        $scope.addressId = item.addressId;
      })
  }
  
    $scope.selectCustomerRemove = function(){
      $scope.selectedCustomerForJob = null;
    }
    $scope.customerJobSearchTemplate = `
    <table class="customer-list" ng-if="!loaderApi">
      <tbody >
          <tr style="cursor: pointer">
            <td>
                <div class="customer-name"><span class="hightLight" ng-bind-html="item.displayName | highlight: item.searchKey"></span></div>
                <div class="customer-address"><span class="hightLight" ng-bind-html="item.fullAddress | highlight: item.searchKey"></span></div>
            </td>
          </tr>
      </tbody>
    </table>
    `;
    $scope.showListCustomer = {  
          minimumChars: 1,
          //maxItemsToRender: 10,
          containerCssClass: 'color-codes',
          selectedTextAttr: 'name',
          itemTemplate : $scope.customerJobSearchTemplate,
          activateOnFocus: true,          
          loading: function() {
            $scope.loadingCustomerApi = true;
          },
          loadingComplete: function() {
            $scope.loadingCustomerApi = false;
          },
          data: function (searchText) {
                if(searchText.trim() === '') {
                  return;
                } else {
                  searchText = searchText.replace('  ', ' ');
                  return apiGateWay.get("/search_customers", {offset: 0, limit: 5, searchKey: searchText, isGroupByAddress: true}).then(function(response) {
                          var responseData = response.data;
                          var map = new Map;                         
                          var filtered = [];
                          response.data.data.data.forEach(function (item) {
                            var index = map.get(item.addressId);
                            if (index === undefined) {
                                map.set(item.addressId, filtered.push(item) - 1);
                                return;
                            }
                            if (filtered[index].Status < item.Status) {
                                filtered[index] = item;
                              }
                          });   
                          if (responseData.status == 200) {        
                            return filtered;
                          }
                  },function(errorResponse) {
  
                  });
                }             
          },
          itemSelected: function (e) {
            $scope.selectedCustomerForJob = e.item;
          }
    }

    $scope.hideListCustomer = (searchText) => {
      setTimeout(function(){
        $scope.productBundleList = "";
      }, 100);
      
    }

  $scope.createNewJob = function(){    
      ngDialog.close();
      let addressId = $rootScope.selectedCustomerNew.addressId;
      
      apiGateWay.send("/one_off_job", {
      addressId: addressId,
    }).then(function(response) {
        if (response.data.status == 201) {
            let createNewJobId = response.data.data.OneOffJobId;     
            let createAddressId = addressId;              
            if (createNewJobId) {
              $state.go("app.onetimejob",{"addressId":createAddressId,"jobId":createNewJobId}, {reload: true});
            }
        } else {

        }
        $scope.isProcessing = false;
        $rootScope.selectedCustomerNew = null;
    });
  }

  $scope.getUpdatedStatus = function (addressId) {
    var pdata = {
      addressId: addressId,
    };
    apiGateWay.get($rootScope.customerDetailEndpoint, pdata).then(function (response) {
      if (response.data) {
        if (response.data.status == 200) {
          $scope.customerinfo = response.data.data;
          if ($scope.customerinfo.customer.customerId) {
            $scope.isDelete = 0;
            if ($scope.customerinfo.customer.isActive == null) {
              $rootScope.isActive = 'Lead';
              $scope.isDelete = 1;
            }
            else if ($scope.customerinfo.customer.isActive == 3) {
              $rootScope.isActive = 'Active (no route)';
            }
            else if ($scope.customerinfo.customer.isActive == 0) {
              $rootScope.isActive = 'Inactive';
            }
            else if ($scope.customerinfo.customer.isActive == 1) {
              $rootScope.isActive = 'Active (routed)';
            }
            else {
              $rootScope.isActive = 'Archived';
            }
          }
        } else {
          $scope.customerinfo = [];
        }
      }
      $scope.isProcessing = false;
    }, function (error) {

    });
  }

  $scope.saveDueDate= ()=>{
    let dueDate = document.getElementById("dueDate").value
    $scope.dueDate = $filter('date')(new Date(dueDate), 'yyyy-MM-dd hh:mm:ss')
  }

  $scope.saveInvoiceType = function(invoiceType) {
    $scope.invoiceType = invoiceType;
  }

  $scope.createNewInvoice = function(){    
        ngDialog.close();
        let addressId = $rootScope.selectedCustomerNew.addressId;
        if (addressId) {
          let postData= {
            "invoiceId":'',
            "customerId": $rootScope.selectedCustomerNew.customerId,
            "addressId": addressId,
            "invoiceStatus": "Awaiting Payment",
            "subTotalAmount": 0,
            "totalAmount": 0,
            "totalChemicalAmount": 0,
            "totalTechnicianCost": 0,
            "customerPayTransIds": "",
            "creditPaymentAdjustment": 0,
            "taxTitle": "",
            "taxValue": 0,
            "invoiceFrom": $scope.date,
            "invoiceTo": $scope.date,
            "amountPaid": 0,
            "taxPercentValue": 0,
            "totalChemicalCost": 0,
            "invoiceType": "Manual",
            "dueDate": $scope.dueDate,
            "invoiceNotes" :'',
            "lineData": [],
            "serviceDetails": [
                {
                "customerPayType": "",
                "jobDetails": [
                    {
                    "chemicalCost": "",
                    "chemicalDetails": [
                        
                    ],
                    "groupId": "",
                    "isChargeForChemicals": "",
                    "jobDate": "",
                    "jobId": "",
                    "noAccess": 0,
                    "rate": ""
                    }
                ],
                "jobRateTotal": "",
                "jobTotal": "",
                "poolType": "",
                "poolTypeId": "",
                "serviceLevelDescription": "",
                "serviceLevelId": "",
                "serviceLevelTitle": "",
                "waterBodyId": "",
                "waterBodyName": ""
                }
            ]
        }
        apiGateWay.send("/create_invoice", postData).then(function(response) {
            if (response.status == "200"){ 
              let invoiceId = response.data.invoiceId; 
              $state.go("app.customerinvoicedetail",{"invoiceId":invoiceId}, {reload: true});   
            } else {     
                $scope.errorBottom = response.data.message;
                $scope.scrollToError('#bottom-section-error')
                setTimeout(function() {
                    $scope.errorBottom = '';
                    if (!$scope.$$phase) $scope.$apply()
                }, 3000);
            }         
            $scope.isProcessing = false; 
            
        }, function(error){
            $scope.errorBottom = error;
            $scope.scrollToError('#bottom-section-error')
            setTimeout(function() {
                $scope.errorBottom = '';
                if (!$scope.$$phase) $scope.$apply()
            }, 3000);
            $scope.isProcessing = false; 
        })
          $scope.isProcessing = false;
          $rootScope.selectedCustomerNew = null;
        }
  }  
  $scope.syncErrorPopup;
  $scope.syncErrorLogs = [];
  $scope.syncErrorLogMsg = '';
  $scope.selectedSyncErrorItem = {};
  $scope.openSyncErrorPopup = (selectedItem, logType) => {
      $scope.selectedSyncErrorItem = selectedItem;
      $scope.selectedSyncErrorItem.logType = logType;
      $scope.getSyncErrorLog();
      $scope.syncErrorPopup = ngDialog.open({
        template: 'templates/component/sync-error-popup.html?ver=' + $rootScope.PB_WEB_VERSION,
        className: 'ngdialog-theme-default v-center',
        overlay: true,
        closeByNavigation: true,
        scope: $scope,
        preCloseCallback: function() {
            $scope.selectedSyncErrorItem = {};
            $scope.syncErrorLogs = [];               
            $scope.syncErrorLogMsg = '';           
        }
    });
  }
  $scope.getSyncErrorLog = () => {
      $scope.isSyncErrorLogProcessing = true;  
      $scope.syncErrorLogs = [];    
      $scope.syncErrorLogMsg = '';  
      let apiURL = '/sync_qbo_logs';        
      apiGateWay.get(apiURL, {
          logType: $scope.selectedSyncErrorItem.logType,
          recordId: $scope.selectedSyncErrorItem.id
      }).then(function(response) {
          if (response.data.status == 200) {                 
              $scope.syncErrorLogs = response.data.data;
              $scope.syncErrorLogMsg = response.data.message ? response.data.message : '';
          }          
          $scope.isSyncErrorLogProcessing = false;  
          $scope.isProcessing = false;          
      },function(error){
          $scope.isSyncErrorLogProcessing = false;
      });
  }
  $scope.reInitSync = () => {
    $scope.isReInitSyncProcessing = true;
    let payload = {};
    if ($scope.selectedSyncErrorItem.logType == 'invoice') {
      payload.invoiceId = $scope.selectedSyncErrorItem.id;
      payload.action = 'invoice';
    }
    if ($scope.selectedSyncErrorItem.logType == 'payment') {
      payload.transactionId = $scope.selectedSyncErrorItem.id;
      if ($scope.selectedSyncErrorItem.transactionType && $scope.selectedSyncErrorItem.transactionType == "Refund") {
        payload.action = 'refund';
      }      
    }
    apiGateWay.send('/sync_payment', payload).then(function(response) {
      if (response.data.status == '200') {
        if ($scope.selectedSyncErrorItem.logType == 'invoice') {
          $rootScope.rootGetCustomerInvoiceList()
        }
        if ($scope.selectedSyncErrorItem.logType == 'payment') {
          $rootScope.rootGetCustomerPaymentList();
        } 
      }
      $scope.syncErrorPopup.close();
      $scope.isReInitSyncProcessing = false;  
  },function(error){
      $scope.isReInitSyncProcessing = false;
  });
  }
  $rootScope.calculateMins = (mins, returnInStr = true) => {
    let result = '';
    let minsArr = mins.split(' ');
    result = minsArr[0];
    if (minsArr.length > 1) {
        let str = minsArr[0]+'';
        if (str.includes('.')) {
            let strArr = str.split('.');
            if (strArr.length > 0) {
              let min = Number(strArr[0]);
              let sec = Number(strArr[1]);
              result = min;
              let totalMinutes = min + (sec / 60);
              let totalMinutesStr = totalMinutes + '';
              let totalMinutesStrArr = totalMinutesStr.split('.');
              if (totalMinutesStrArr.length > 1) {
                let finalMinute = totalMinutesStrArr[0];
                let finalDecimal = totalMinutesStrArr[1];
                finalDecimal = finalDecimal + '';
                finalDecimal = finalDecimal[0];
                if (finalDecimal == 0 || finalDecimal == '0') {
                    finalDecimal = ''
                } else {
                    finalDecimal = '.' + finalDecimal 
                }
                result = finalMinute + finalDecimal 
              }
            }
        }            
    }
    if (!returnInStr) {
      return Number(result)
    }
    return result + ' mins'
  }
  
  $rootScope.loadMoreCustomer = () => {
    $rootScope.isProductPopupSearching = true;
    $scope.searchProductIntervalGap = 0;
    clearInterval($scope.searchInterval);
    $rootScope.searchCustomerPayload.offset = $rootScope.searchCustomerPayload.offset + 1;
    $scope.showCustomerList($rootScope.searchCustomerPayload.searchKey ? $rootScope.searchCustomerPayload.searchKey : "", true);
  };
  
  $rootScope.searchCustomerPayload = {
    isGroupByAddress: false,
    limit: 5,
    offset: 0,
    searchKey: '',
    rows: 0,
    hasMoreData: false,
  };
  $scope.requiredPayload = () => {
    let payload = angular.copy($rootScope.searchCustomerPayload);
    delete payload.rows;
    delete payload.hasMoreData;
    return payload;
  };
  
  $rootScope.showCustomerList = function(searchText, offsetModified=false) {
    // multiple request
    let endpoint = '/search_customers';
    var currEnvironment = $scope.config.currEnvironment;
    var apiUrl = $scope.config[currEnvironment].server;        
    var pr = $scope.pendingRequests.get();        
    if (pr.length > 0) {
        pr.forEach(function(r){
            if (r.url === apiUrl + endpoint) {                    
                r.canceller.resolve()
                return
            }
        })
    } 
    // multiple request
    if (!offsetModified) {
        $scope.searchProductIntervalGap = 500;
        $rootScope.searchCustomerPayload.offset = 0;
        $rootScope.searchCustomerPayload.rows = 0;
        $rootScope.searchCustomerPayload.hasMoreData = false;
    }
    
    if (searchText != $rootScope.searchCustomerPayload.searchKey) { $rootScope.searchListCustomer = []; }
    $rootScope.selectedCustomerNew = null;
    $rootScope.searchCustomerPayload.searchKey = searchText;
    clearInterval($scope.searchInterval);       
    $scope.searchInterval = setTimeout(function() {
        if(searchText.length>0){
            $rootScope.isCustomerSearch = true;
            $rootScope.isProductPopupSearching = true;
            apiGateWay.get("/search_customers", $scope.requiredPayload()).then(function(response) {
                if (response.data.status == 200 && response.data.data.data.length > 0) {
                    $rootScope.searchCustomerPayload.rows = response.data.data.totalCount;                        
                    $rootScope.searchCustomerPayload.hasMoreData = (($rootScope.searchCustomerPayload.offset + 1) * $rootScope.searchCustomerPayload.limit) < response.data.data.totalCount;                        
                    let bundleSearchList = response.data.data.data;
                    if ($rootScope.searchListCustomer.length > 0) {
                      // Remvoed the existing customers from autosuggested dropdown
                      if (offsetModified) {
                          angular.forEach(bundleSearchList, (customer, index) => {
                            let find = $rootScope.searchListCustomer.findIndex((element) => {
                              return element.addressId === customer.addressId;
                            });
                            if (find === -1) {
                              $rootScope.searchListCustomer.push(customer);
                            }
                        });
                     } else {
                        $rootScope.searchListCustomer = bundleSearchList;
                      }
                    } else {
                      $rootScope.searchListCustomer = bundleSearchList;
                    }
                } else {
                    $rootScope.searchListCustomer = [];
                }
                $rootScope.isProductPopupSearching = false;
                setTimeout(() => {
                    var objDiv = document.getElementsByClassName("ps-picker")[0];
                        objDiv.scrollTop = objDiv.scrollHeight;
                }, 100)
            });
    } else {
      $rootScope.searchListCustomer = [];
      $rootScope.isCustomerSearch = false
      $rootScope.isProductPopupSearching = false;
    }
    }, $scope.searchProductIntervalGap)       
  }
  
  $rootScope.selectCustomerNew = (customer) => {
    $rootScope.selectedCustomerNew = customer;
    $rootScope.searchListCustomer = [];
    $rootScope.searchCustomerPayload.searchKey = '';
    $rootScope.isCustomerSearch = false;
    $rootScope.isProductPopupSearching = false;
  }
  
  $rootScope.selectedCustomerRemove = function(){
    $rootScope.selectedCustomerNew = null;
  }
  
  checkDeviceSize();  
  $rootScope.addAnimateClass = () => {
    addAnimateClass();
  }
  $rootScope.isFullScreenSearchBoxOpen = false;
  $rootScope.toggleSideBar = () => {
    $rootScope.sidebarOpened = !$rootScope.sidebarOpened;    
  }
  function checkDeviceSize() {  
    if (window.innerWidth <= 1200) {
      $rootScope.sidebarOpened = false
    } else {          
      $rootScope.sidebarOpened = true
    }
  }  
  function addAnimateClass() {
    let _animatedElements = ['.pb-app #content .sidebar', '.pb-app #content .mainContent', '.pb-app #pb-header #logo' , '.pb-app #pb-header #headerLinks'];
    angular.forEach(_animatedElements, function(_class){
      let element = document.querySelectorAll(_class);
      if (element.length > 0) {
        element[0].classList.add('canAnimate')
      }
    })
  }
  window.addEventListener('resize', checkDeviceSize);
  window.addEventListener('load', checkDeviceSize);
  window.addEventListener('load', addAnimateClass);

  // Multiple checklist
  $rootScope.checklistTypes = [
      { 
        key: 'checklistItem',
        label: 'Checklist Item',
        maxLength: 300, 
        icon: '/resources/images/checklist_icons/checklist_type_1.png?ver=' + $rootScope.PB_WEB_VERSION,
        placeholderText: 'Enter Checklist Item',
        helpText: {
          title: 'CHECKLIST ITEM',
          description: 'Technician will see the text you\'ve entered and can tap the item to mark it as complete',
        },
      },
      { 
        key: 'dropDownMenu',
        label: 'Drop Down Menu',
        maxLength: 1000, 
        icon: '/resources/images/checklist_icons/checklist_type_2.png?ver=' + $rootScope.PB_WEB_VERSION,
        placeholderText: '',
        helpText: {
          title: 'DROP DOWN MENU',
          description: 'Technician will see the menu title and can select from the menu options you\'ve set. Click the item to edit the title or options.',
        },
      },
      { 
        key: 'question',
        label: 'Question',
        maxLength: 1000, 
        icon: '/resources/images/checklist_icons/checklist_type_3.png?ver=' + $rootScope.PB_WEB_VERSION,
        placeholderText: 'Enter Question',
        helpText: {
          title: 'YES/NO TOGGLE',
          description: 'Technician will see the text you\'ve entered and can select "Yes" or "No" options',
        },
        helpText: {
          title: 'QUESTION FIELD',
          description: 'Technician will see the text you\'ve entered and can enter any response they want in an open field beneath it',
        },
      },
      { 
        key: 'yesNo',
        label: 'Yes/No',
        maxLength: 1000, 
        icon: '/resources/images/checklist_icons/checklist_type_4.png?ver=' + $rootScope.PB_WEB_VERSION,
        placeholderText: 'Enter Yes/No Question',        
        helpText: {
          title: 'YES/NO TOGGLE',
          description: 'Technician will see the text you\'ve entered and can select "Yes" or "No" options',
        },
      },
  ];
  $rootScope.getChecklistType = function(key) {
      if (!key) key = 'checklistItem';
      return $rootScope.checklistTypes.find(type => type.key === key) || $rootScope.checklistTypes.find(type => type.key === 'checklistItem');;
  };
  $rootScope.getCheckListToolTip = function(type) {
    let tooltip = `<span class="checklist-help-text">
                      <span class="checklist-help-text-title">`+$rootScope.getChecklistType(type)?.helpText.title+`</span>
                      <span class="checklist-help-text-desc">`+$rootScope.getChecklistType(type)?.helpText.description+`</span>
                   </span>`;
    return tooltip
  }
  // Multiple checklist
})

.controller('techRatingController', function($scope, $rootScope,$window, $templateCache, $filter, ngDialog, auth, apiGateWay, config, $location,$intercom, $state) {
    $scope.reviewByMail = false;
    $intercom.shutdown();
    var model = {
      customerId: '',
      jobId: '',
      managerId: '',
      onBehalf: '',
      rating: '',
      review: '',
      reviewDate: $filter('date')(new Date(), 'MM/dd/yyyy'),
      techId: ''
    }

    $scope.reviewError = ''
    $scope.reviewSuccess = ''

    $scope.saveTechReview = function(showSuccessMsg,addNewReview=false){
      var gatewayCall = $scope.reviewByMail ? apiGateWay.get : apiGateWay.send;
      $scope.reviewError = ''
      $scope.reviewSuccess = ''
      $scope.reviewOnEnterSuccess = ''


      if(($scope.model.onBehalf=='Customer' && !$scope.model.customerId) && !$scope.reviewByMail){
        return false;
      }
      if(!$scope.reviewByMail && ['Customer','Myself'].indexOf($scope.model.onBehalf)==-1){
        return false;
      }

      $scope.isReviewProcessing = true;
      $scope.model['reviewDate'] = $filter('date')(new Date($scope.model['reviewDate']), 'yyyy-MM-dd')
      var obj = angular.copy($scope.model);
      if (!obj['review']) {
        obj['review'] = "No details provided";
      }
      if(addNewReview){
        obj['add_review'] = 1;
      }
      else{
        gatewayCall("/tech_rating", obj).then(function(response) {
          if (response.data.status == 200) {
            var responseData = response.data.data;
            $scope.isReviewProcessing = false;
            $scope.reviewSuccess = response.data.message
            if(responseData.techRatingId){              
              if (responseData!=null && responseData.rating!=null){
                var ratingObj =  responseData.rating;
                $rootScope.techRating = {
                  'up': ratingObj && ratingObj.up ? ratingObj.up : 0,
                  'down': ratingObj && ratingObj.down ? ratingObj.down : 0
                }
                if (Number(ratingObj.up) > 0 && Number(ratingObj.down) > 0) {
                  $rootScope.hasFeedback = true;                      
                }
                if (Number(ratingObj.up) > 0 && Number(ratingObj.down) == 0) {
                  $rootScope.hasFeedback = true;
                }
                if (Number(ratingObj.up) == 0 && Number(ratingObj.down) > 0) {
                  $rootScope.hasFeedback = true;
                }
                if (Number(ratingObj.up) == 0 && Number(ratingObj.down) == 0) {
                  $rootScope.hasFeedback = false;
                }
              }
              $scope.ratingType = ($rootScope.techRating.up - $rootScope.techRating.down > 0) ? 'positive' : 'negative';
              $scope.ratingCount = Math.abs($rootScope.techRating.up - $rootScope.techRating.down);
            }
            ngDialog.closeAll();
            if($scope.reviewByMail && !showSuccessMsg){
              $scope.reviewOnEnterSuccess = "Thank you. Your feedback has been recorded. We appreciate any additional details you would like to provide.";
            }
  
            if($scope.reviewByMail && showSuccessMsg){              
              $scope.reviewSuccess = response.data.message
            }
          }
          $scope.isReviewProcessing = false;
          if ($state.current.name == 'app.techniciandetail') {
            $scope.$parent.generateFeedbackChart();
          }
        }, function(error) {
          $scope.reviewError = error
          setTimeout(function(){
            $scope.reviewError = ''
          }, 2000);
          $scope.isReviewProcessing = false;
        });
      }
    }


    $scope.model = angular.copy(model);
    var queryParams = $location.search();
    if (queryParams['jobid'] && queryParams['rating'] && queryParams['techid'] ) {
      var rating = $window.sessionStorage['rating'];      
      if(!rating || rating==''){
        //$window.sessionStorage["rating"] = '';  
        $scope.model.jobId = queryParams['jobid'];
        $scope.model.rating = queryParams['rating'];
        $scope.model.techId = queryParams['techid'];
        $scope.reviewByMail = true;
        $scope.saveTechReview(false,true);      
      } else {
        $window.sessionStorage["rating"] = "";
        $window.location.href = 'https://www.poolbrain.com';       
      }
      
    }


    $(document).ready(function() {
        $('.input-daterange').datepicker({
            autoclose: true,
            endDate: moment().format('MM-YYYY'),
            todayBtn: "linked"
        });
    });

    $rootScope.$on('ngDialog.opened', function (e, $dialog) {
        if($dialog.name === 'reviewBox'){
          setTimeout(function(){
              $('.input-daterange').datepicker({
              autoclose: true,
              endDate: moment().format('MM-YYYY'),
              todayBtn: "linked"
          });
        }, 200);
        }
    });

    $scope.autoCompleteOptions = {
        minimumChars: 1,
        //maxItemsToRender: 10,
        containerCssClass: 'color-codes',
        selectedTextAttr: 'name',
        //itemTemplate : $templateCache.get('customer-auto-complete-review'),
        data: function (searchText) {
              searchText = searchText.replace('  ', ' ');
              return apiGateWay.get("/search_customers", {offset: 0, limit: 10, searchKey: searchText}).then(function(response) { 
                      var responseData = response.data.data;
                      if (response.data.status == 200) {
                        return responseData.data;
                      }
              },function(errorResponse) {

              });
        },
        renderItem: function (item) {
              return {
                  value: item.fullName,
                  label: "<p class='auto-complete' ng-bind-html='item.fullName'></p>"
              };
        },
        itemSelected: function (e) {
            var customerObj = e.item;
            $scope.model.customerId = customerObj.customerId;
            $scope.model.customerName = customerObj.fullName;
        }
    }

    $scope.rateTach = function(jobId, techId, userId, type, customerId){

        $scope.model.techId = techId;
        $scope.model.rating = type;
        $scope.model.managerId = userId;
        $scope.model.jobId = jobId;
        $scope.model.customerId = customerId;
        reviewModal();
    }

    var reviewModal = function(){
        ngDialog.open({
            template: 'templates/reviewmodal.html?ver=' + $rootScope.PB_WEB_VERSION,
            className: 'ngdialog-theme-default',
            scope: $scope,
            name :'reviewBox',
            preCloseCallback: function() {
              $scope.model = angular.copy(model);
            }
        });
    }

    $scope.clickDate = function(event) {
        angular.element(document.getElementsByClassName('currentDateCalendar')).removeClass('currentDateCalendar');
        angular.element(event.target.parentNode).addClass('currentDateCalendar');
    }

    $scope.isReviewProcessing = false;
    $scope.reviewError = '';

     $scope.promptExit = function() {  
          
       if (queryParams['jobid'] && queryParams['jobid']!='' && queryParams['rating'] && queryParams['rating']!='' && queryParams['techid'] && queryParams['techid']!='') {      
            $window.sessionStorage["rating"] = 'YES';         
            return false;
        } else {
            return;
        }
        
    };
    $window.onbeforeunload = $scope.promptExit; 
})

.controller('leftBarController', function($scope,companyService, $filter, $rootScope, $parse, $state, $interval, apiGateWay, auth, Analytics) {
    $scope.activeMenu = 'Alert';
    var session = auth.getSession();
    $scope.permissions = session;
    //hoverin hoverout function to show hide logged in users detail

    $scope.hoverIn = function(show2, id, data) {
        // Get the model
        $scope.osmData = data;
        var show = show2 + id;
        var model1 = $parse(show);
        // Assigns a value to it
        model1.assign($scope, true);
        // this.hoverEdit = true;
    };
    $scope.hoverOut = function(hide2, id, data) {
        // Get the model
        var hide = hide2 + id;
        var model2 = $parse(hide);
        // Assigns a value to it
        model2.assign($scope, false);
    };
    $scope.loggedInRole = auth.loggedInRole();
    if($scope.loggedInRole == 'companyadmin' && !session.isCompanyHasFullSignUp){
        $scope.loggedInRole = 'user';
    }   
    $rootScope.defaultServiceLevelData = {
      id: 0
    };  
    $rootScope.defaultServiceLevelDataFetched = false;
    $rootScope.getDefaultServiceLevelData = () => {
      if (!$rootScope.defaultServiceLevelDataFetched) {
        $rootScope.defaultServiceLevelData = {
          id: 0
        };
        apiGateWay.get("/get_default_serviceLevel_data").then(function(response) {
          if (response.data.status == 200) {
            let resData = response.data.data;
            $rootScope.defaultServiceLevelData = resData.serviceLevel[0].serviceLevel
            $rootScope.defaultServiceLevelDataFetched = true;
          }
        }, function(error) {
            $rootScope.defaultServiceLevelDataFetched = true;
        });
      }
    }
    if(companyService.selectedCompany && companyService.selectedCompany != "0") {
      $rootScope.getDefaultServiceLevelData();
    } else {
      if ($rootScope.userSession.userType !== "administrator") {
        if ($rootScope.userSession.companyId) {
          companyService.selectedCompany = $rootScope.userSession.companyId
        }
      }
    }
    $rootScope.$watch('selectedCompany', function(o, n) {
      $rootScope.defaultServiceLevelDataFetched = false;
      if(companyService.selectedCompany && companyService.selectedCompany != "0") {
        $rootScope.getDefaultServiceLevelData();
      }
    });       
    $rootScope.sortServiceLevel = (data, section="serviceLevel") => {
      function _manage(a, b) {
        if ( a.serviceLevel.isSystem > b.serviceLevel.isSystem ){ return -1 }
        if ( a.serviceLevel.isSystem < b.serviceLevel.isSystem ){ return  1 }
        return 0;
      }
      function _manage2(a, b) {
        if ( a.isSystem > b.isSystem ){ return -1 }
        if ( a.isSystem < b.isSystem ){ return  1 }
        return 0;
      }
      function _manage3(a, b) {
        if ( a.customerPayId > b.customerPayId ){ return -1 }
        if ( a.customerPayId < b.customerPayId ){ return 1 }
        return 0;
      }
      if (section == 'serviceLevel') {
        data = data.sort(_manage);
      }
      if (section === 'techPay') {
        data = data.sort(_manage2);
      }
      if (section === 'techPayWithPoolTypes') {
        data = data.sort(_manage2);
        let DataCache = angular.copy(data)
        DataCache.forEach(function(sLevel, index){
          if (sLevel.poolType && sLevel.poolType.length > 0) {
            DataCache[index].poolType = DataCache[index].poolType.sort(_manage3);
          }
        })   
        data = DataCache     
      }
      if (section === 'chemReadings') {
        if (data && data.length > 0) {
          data.forEach(function(v){
            if (v.serviceLevelId == 0) {
              v.isSystem = -1
            }
          })
        }
        data = data.sort(_manage2);
      }
      return data;
    }    
    if (!$scope.initiatedIncomeAccounts && auth.getSession().isCompanyHasFullSignUp && $rootScope.currentState !== 'app.companysettings' && $rootScope.currentState !== 'administrator.settings') {
      $scope.getIncomeAccount()
    }
    var companySelectedEventListener =  $rootScope.$on("companySelected", function(data) {
      $scope.getIncomeAccount()      
    });
    let SuperAdminLoaded = false;
    if (!SuperAdminLoaded && auth.loggedInRole() == "administrator"  && $rootScope.currentState !== 'app.companysettings' && $rootScope.currentState !== 'administrator.settings') {
      SuperAdminLoaded = true
      $scope.getIncomeAccount()
    }
    $rootScope.initSyncCompanyCustomers = function(type) {
      apiGateWay.get("/sync_customers_qb",{type:type}).then(function(response) {
        if (response.data) {
            if (response.data.status == 200) {
              if($rootScope.qboSyncEnabled) {
                apiGateWay.get('/sync_qbo_cron', {companyId:auth.getSession().companyId, action:'All'}).then(function(response) {

                })
              }
              $scope.successSync = response.data.message;
              setTimeout(function(){
                $scope.successSync = false;
              }, 5000);
            } else {
              $scope.error = response.data.message;
            }
        }
    });
  }
  $rootScope.qboAccounts = [];
  $rootScope.defaultQboAccounts = {
    product_income: 0,
    product_expense: 0,
    service_income: 0,
    service_expense: 0
  };
  $rootScope.isQboAccountsFetched = false;
  $rootScope.isQboAccountsFetching = false;
  $rootScope.getQboAccounts = function () {
    if (!$rootScope.isQboAccountsFetched) {
      $rootScope.qboAccounts = [];
      $rootScope.defaultQboAccounts = {
        product_income: 0,
        product_expense: 0,
        service_income: 0,
        service_expense: 0
      };
      $rootScope.isQboAccountsFetching = true;
      $rootScope.settingPageLoaders.qboSection.defaultAccount = true;
      apiGateWay.get('/get_all_qbo_accounts').then(function(response){          
        if(response.data.status == 200 && response.data.data){
          $rootScope.parseQboAccountsData(response.data.data);
        }
        $rootScope.isQboAccountsFetching = false;
        $rootScope.settingPageLoaders.qboSection.defaultAccount = false;
      }, function(error){
        $rootScope.isQboAccountsFetching = false;
        $rootScope.settingPageLoaders.qboSection.defaultAccount = false;
      })
    }
  }
  $rootScope.parseQboAccountsData = function(data) {
    $rootScope.isQboAccountsFetched = true;
    if (data.allQboAccounts && data.allQboAccounts.length > 0) {
      $rootScope.qboAccounts = data.allQboAccounts;      
    }
    $rootScope.defaultQboAccounts = {
      product_income: data.incomeAccountProducts ? data.incomeAccountProducts : 0,
      product_expense: data.expenseAccountProducts ? data.expenseAccountProducts : 0,
      service_income: data.incomeAccountServices ? data.incomeAccountServices : 0,
      service_expense: data.expenseAccountServices ? data.expenseAccountServices : 0
    };    
  }
  $rootScope.getQboAccountNameById = function(id) {
    let accountName = 'None';
    let account = $rootScope.qboAccounts.find(item => item.accountId == id);
    if (account) {
        accountName = account.accountName ? account.accountName : 'None';
    }
    return accountName
  }
});
