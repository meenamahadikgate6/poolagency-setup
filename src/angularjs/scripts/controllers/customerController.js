angular.module('POOLAGENCY')

.controller('customerController', function($scope, $state, $rootScope, $filter, $sce, $http, apiGateWay, service, $stateParams, $timeout, ngDialog, Analytics, auth, $anchorScroll, $location, getDromoConfig, configConstant, companyService, pendingRequests) {
    $scope.currentPage = 1;
    $scope.showingFrom = 1;
    $scope.limit = 10;
    $scope.customerName = '';
    $scope.address = '';
    $scope.isProcessing = false;
    $scope.uploadFiles = [];
    $scope.ifCustomerExists = false;
    $rootScope.IsVisibleCityState = false;
    $scope.loggedInRole = auth.loggedInRole();
    $scope.session = auth.getSession();
    $scope.groupCompanyId = $stateParams.companyId ? Number($stateParams.companyId) : null;
    $scope.showFilterBox = false;
    $scope.getStatusName = {};
    $scope.isFilterMasterLoading = {};
    $scope.equipments = [];
    $scope.zipCodesMaster = []; 
    $scope.citiesMaster = []; 
    $scope.tagsMaster = [];
    $scope.isMasterFilterFetched = {};
    $scope.serviceLevelArray = [];
    $scope.routes =[];
    $scope.routesCache =[];
    $scope.isRoutesLoading = false;
    $scope.routeListDate = moment();
    $scope.masterFilterLoading = false;
    $scope.selectionsMade = [];
    $scope.customerSortColumn = 'displayName';
    $scope.customerSortDir = 'asc';
    $scope.filterInitiated = false;
    var companySelectedEventListener = $rootScope.$on("companySelected", function(data) {
        $scope.currentPage = 1;
        $scope.limit = 10;
        $scope.customerName = '';
        $scope.address = '';
        $scope.isProcessing = false;
        $scope.uploadFiles = [];
        $scope.customerNameORAddress = '';
        $scope.ifCustomerExists = false;
        $scope.companyEmailforReports = auth.loggedInRole() != "administrator" ? auth.getSession().email : auth.getSession().companyEmail;
        if (!$scope.$$phase) $scope.$apply();

      $scope.currentPage = 1;
      $scope.isMasterFilterFetched = {};
      $scope.filterInitiated = false;
      $scope.routesCache = [];
      $scope.initCustomerFilter();
      $scope.getCustomerList();
    });
    $scope.$on('$destroy', function() {
        companySelectedEventListener();
    });
    $scope.archiveCustomer = 0;
    $scope.statusType = { 'Active': true,'Active_noroute': true, 'Inactive': true, 'Lead': true };
    $scope.customerFilterStatus = {
        Active: 'Active',
        Active_noroute: 'Active_noroute',
        Inactive: 'Inactive',
        Lead: 'Lead'
    }
    $scope.selectedType = ['Active','Active_noroute', 'Inactive', 'Lead'];
    $scope.shownExcelReport = true;
    $scope.archiveStatus = false;
    //function to get customer list
    $scope.getCustomerList = function(retryCount=0) { 
        const maxRetries = 20;
        const retryDelay = 1000; 
        $scope.isProcessing = true; 
        if ($scope.session && $scope.session.canAccessMultiCompany && $scope.groupCompanyId != null) {
            if ($rootScope.groupCompanyListLoaded) {
                if ($rootScope.groupCompanyList && $rootScope.groupCompanyList.length > 0) {
                    let requestedCompanyId = Number($state.params.companyId);
                    let isCompanyExist = $rootScope.groupCompanyList.find(company => company.companyId === requestedCompanyId);
                    if (!isCompanyExist) {
                        $scope.redirectToList();
                    } else {
                        $rootScope.showCompanyById($scope.groupCompanyId);
                        $scope.getCustomerListAPI();
                    }
                } else {
                    $scope.redirectToList();
                }       
            } else if (retryCount < maxRetries) {                
                setTimeout(function() {
                    $scope.getCustomerList(retryCount + 1);
                }, retryDelay);
            } else {                
                console.error("Max retries reached. Group company list could not be loaded.");
                $scope.redirectToList();
                $scope.isProcessing = false;
            }
        } else {
            $scope.getCustomerListAPI();
        }
    };
    $scope.redirectToList = function() {
        $state.go('app.customer', {}, { reload: true });
    }
    $scope.getCustomerListAPI = function() {        
        let customerPayload = {
            offset: $scope.currentPage - 1,
            limit: $scope.limit,
            customerNameORAddress: $scope.customerNameORAddress ? $scope.customerNameORAddress.replace('  ', ' ') : '',
            archiveCustomer: $scope.archiveCustomer,
            Active: $scope.customerFilterStatus.Active,
            Active_noroute: $scope.customerFilterStatus.Active_noroute,
            Inactive: $scope.customerFilterStatus.Inactive,
            Lead: $scope.customerFilterStatus.Lead
        };
        apiGateWay.get("/customers", customerPayload).then(function(response) {
            if (response.data.status == 200) {
                $scope.customerCounts();
                var customerListResponse = response.data.data;
                $scope.totalRecord = customerListResponse.rows;
                $scope.totalPage = ($scope.totalRecord % $scope.limit) !== 0 ? parseInt($scope.totalRecord / $scope.limit) : parseInt(($scope.totalRecord / $scope.limit)) - 1;
                $scope.customerList = customerListResponse.data;
                if(!$scope.ifCustomerExists && $scope.customerList.length > 0){
                    $scope.ifCustomerExists = true;
                }

            } else {
                $scope.customerList = [];
                $scope.ifCustomerExists = false;
            }
            $scope.isProcessing = false;
        }, function(error) {
            $scope.isProcessing = false;            
        });
    };

    //fuction for getting counts of all customers
    $scope.counts = {
        activeRouteCustomers: 0,
        activeNoRouteCustomers: 0,
        inActiveCustomer: 0,
        leadCustomer: 0
    }
    $scope.customerCounts = function () {
        apiGateWay.get("/customer_total_count", {}).then(function (response) {
            if (response.data.status == 200) {
                counts = response.data.data;
                $scope.counts = {
                    activeRouteCustomers: counts.activeRouteCustomers,
                    activeNoRouteCustomers: counts.activeNoRouteCustomers,
                    inActiveCustomer: counts.inActiveCustomer,
                    leadCustomer: counts.leadCustomer
                }
            }
        }, function (error) {
            $scope.isProcessing = false;
        })
    }
    //function to redirect to customer detail page
    $scope.goToDetail = function(addrId,isPrimary="") {
        if (addrId) {
            ngDialog.close();
            if(isPrimary==1){
                $state.go("app.customerdetail", {
                    addressId: addrId
                });
            }else{
                $state.go("app.locationdetail", {
                    addressId: addrId
                });
            }
            
        }
    };

    $scope.parseCustomerName = function(customer) {
        var customerName = '';
        if (customer.lastName && !customer.firstName) {
            customerName = customer.lastName;
        }
        if (!customer.lastName && customer.firstName) {
            customerName = customer.firstName;
        }
        if (customer.lastName && customer.firstName) {
            customerName = customer.firstName + " " + customer.lastName;
        }
        if (customerName.length > 14) {
            customerName = customerName.substring(0, 14) + "...";
        }
        return customerName;
    };
    $scope.getNumberToArray = function(num) {
        return new Array(num);
    };
    $scope.goToCustomerPage = function(page) {
        $scope.currentPage = page;
        $scope.showingFrom = page* $scope.limit - ($scope.limit-1);
        if ($scope.selectionsMade.length > 0) {
            $scope.selectionsMadeChanged();
        } else {
            $scope.getCustomerList();
        }
    };
    $scope.showAddressList = function(addressList, selectedCustomerId) {
        ngDialog.open({
            template: 'addressList.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function() {
                /* Do something here*/
                $scope.selectedCustomerId = 0;
                $scope.addressListOnModel = {};
            }
        });
        $scope.addressListOnModel = addressList;
        $scope.selectedCustomerId = selectedCustomerId;
    };


    $scope.doSearchCustomerList = function($event) {
        //if ($event.target.value || $scope.customerList.length ==0) {
        $scope.currentPage = $scope.showingFrom = 1;
        $scope.customerNameORAddress = $event.target.value.trim().replace(/,/g, "")
        var analyticsData = {};
        analyticsData.userData = $rootScope.userSession;
        analyticsData.data = {
            "search": $scope.customerNameORAddress
        };
        analyticsData.actionTime = new Date();
        var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
        var analyticsDataString = JSON.stringify(analyticsData);
        $rootScope.storeAnalytics('Customers', "Customers - Search Customer - " + $scope.customerNameORAddress + " - " + currentDateTime, analyticsDataString, 0, true);
        $scope.getCustomerList();
        //}
    };

     $scope.uploadFile = function(){
        var filename = event.target.files[0];
    };

    $scope.successBrowse = false;
    $scope.errorBrowse = false;
    $scope.uploadCsvFile = function(event) {

      var fd = new FormData();
      var file = event.target.files[0];
      fd.append("uploadFile", file);
      $scope.successBrowse = false;
      $scope.errorBrowse = false;
      $scope.isProcessing = true;
      apiGateWay.post("/company/import_customer", fd).then(function(response) {
            var responseData = response.data;
            var message = responseData && responseData.message ? responseData.message : "";
            if (responseData.status == 200) {
              $scope.successBrowse = message;
              $scope.errorBrowse = false;
              $scope.model = {};
              angular.element("input[type='file']").val(null);
              setTimeout(function(){
                $scope.successBrowse = false;
                $scope.getCustomerList();
              },1000);

            } else {
                $scope.successBrowse = false;
              $scope.errorBrowse = message;
            }
            resetProcess();
          },
          function(errorResponse) {
            $scope.error = errorResponse;
            $scope.successBrowse = false;
            $scope.errorBrowse = errorResponse;
            resetProcess();
          }
        );
    };

    var resetProcess = function(){
      setTimeout(function(){
        $scope.success = false;
        $scope.error = false;
        if (!$scope.$$phase) $scope.$apply();
      }, 2000);
      $scope.isProcessing = false;
    }
    /*customer form*/
    $rootScope.customerModel = {};
    $rootScope.isProcessingxRs = false; 
    $rootScope.addEditCustomerForm = function(customerObj) {         
        $rootScope.customerModel = {};
        if(customerObj && customerObj.addressList && customerObj.addressList.length > 0){
            angular.forEach(customerObj.addressList, function(item, index) {
                customerObj.addressList[index].addressLine1 = item.address;
            });
            $rootScope.customerModel = angular.copy(customerObj);
        } else {
            $rootScope.customerModel.addressList = [];
            $rootScope.addNewAddress(0);
        }
        $rootScope.isAddEditCustomerPopup = true;
        $rootScope.addCustomerPopup = ngDialog.open({
            template: 'addCustomerTemplate.html',
            className: 'ngdialog-theme-default',
            scope: $rootScope,
            preCloseCallback: function() {
                $rootScope.customerModel = '';
                $rootScope.isAddEditCustomerPopup = false;
                $rootScope.IsVisibleCityState = false;
            }
        });
    };
    $rootScope.closeCustomerPopup = function(){
        if ($rootScope.addCustomerPopup) {
            $rootScope.addCustomerPopup.close();
        }
        $rootScope.IsVisibleCityState = false;
        $rootScope.isAddEditCustomerPopup = false;
    }
    $rootScope.adjustNgDialogHeight = function(){
        setTimeout(function(){
            if(document.getElementsByClassName("modal-box")[0].offsetHeight+188 > window.innerHeight){
                document.getElementsByClassName("ngdialog-overlay")[0].style.right = '17px';
            } else {
                document.getElementsByClassName("ngdialog-overlay")[0].style.right = '0';
            }
        }, 100)
    }
    $rootScope.addNewAddress = function(index){
        if($rootScope.customerModel.addressList &&  $rootScope.customerModel.addressList.length <= 30){
            var newRowAddress = {
                "city": "",
                "state": "",
                "address": "",
                "zipcode": "",
                "addressLine1": "",
                "addressId":0
            }
            if($rootScope.customerModel && $rootScope.customerModel.addressList){
                $rootScope.customerModel.addressList.push(newRowAddress);
            } else {
                $rootScope.customerModel.addressList = [];
                $rootScope.customerModel.addressList.push(newRowAddress);
            }

            $rootScope.adjustNgDialogHeight(); 
           
        } else {
            $rootScope.errorCustomerFormxRs = 'Maximum 30 address are allowed';       
            setTimeout(function() {
                $rootScope.errorCustomerFormxRs = "";
               
            }, 1000);
            return false
        }
    }
    
    $rootScope.$watch('datafetchedaddress',function(newVal, oldVal){
        if(newVal && $rootScope.isAddEditCustomerPopup){
           $scope.customerModel.addressList[$rootScope.selectedautocompleteId].city = newVal.locality ? newVal.locality : "";
           $scope.customerModel.addressList[$rootScope.selectedautocompleteId].state = newVal.administrative_area_level_1 ? newVal.administrative_area_level_1 : "";
           $scope.customerModel.addressList[$rootScope.selectedautocompleteId].zipcode = newVal.postal_code ? newVal.postal_code : "";
           $scope.customerModel.addressList[$rootScope.selectedautocompleteId].addressLine1 = newVal.address ? newVal.address : "";
          // $scope.customerModel.addressList[$rootScope.selectedautocompleteId].addressLine1 = newVal.street_number + ' ' + newVal.locality + ' ' + newVal.administrative_area_level_1 ? newVal.street_number + ' ' + newVal.locality + ' ' + newVal.administrative_area_level_1 : "";
        }
         
      }); 

     

    $rootScope.setSelectedAutoCompleteId = function(id){
        $rootScope.selectedautocompleteId = id;
    }
    $rootScope.defaultServiceLevelDataFetched = false;
    $rootScope.addEditCustomer = function(customerModel) {
        $rootScope.defaultServiceLevelDataFetched = false;
        $scope.getDefaultServiceLevelData();
        
        $rootScope.adjustNgDialogHeight();

        $scope.customerModel.addressList[$rootScope.selectedautocompleteId].addressLine1 = $scope.customerModel.addressList[$rootScope.selectedautocompleteId].addressLine1.replace(/,/g, '');

        $scope.customerModel.addressList[$rootScope.selectedautocompleteId].addressLine1; 


        var customerModelNew = angular.copy(customerModel);     
        if(!customerModel.customerId){
            customerModelNew.customerId = 0;
        }        
           
        if($rootScope.customerModel.addressList.length == 0){
            $rootScope.errorCustomerFormxRs = 'Please add at least one address';
            setTimeout(function() {
                $rootScope.errorCustomerFormxRs = "";
            }, 1000);
            return false
        }
      
        $scope.isProcessing = true;      
        $rootScope.isProcessingxRs = true; 
       

        apiGateWay.send("/manage_address", customerModelNew).then(function(response) {           
            if (response.data.status == 200) {
                $rootScope.successCustomerFormxRs = response.data.message;
                if(response.data.data.newCustomerAddrId){
                    $scope.addressId = response.data.data.newCustomerAddrId;
                    let serviceLevelData = {
                        id: $rootScope.defaultServiceLevelData.id,
                        addressId: response.data.data.newCustomerAddrId,
                        waterBodyId: response.data.data.waterbodyId,
                        serviceLevelCheck: 1 
                    }
                    apiGateWay.send("/customer_level_tax",{'addressId': $scope.addressId}).then(function(response) {                         
                        apiGateWay.send("/assign_servicelevel", serviceLevelData).then(function(response) {
                            if (response.data.status == 200) {
                                $state.go('app.customerdetail', {
                                    addressId:$scope.addressId
                                });
                            }    
                        });                        
                    });  
                }
               
                $scope.getCustomerList();                
                setTimeout(function() {
                    $rootScope.successCustomerFormxRs = '';
                    $scope.closeCustomerPopup();   
                }, 2000);
                
            } else {
                $rootScope.errorCustomerFormxRs = 'Please add at least one address';
                setTimeout(function() {
                    $rootScope.errorCustomerFormxRs = "";
                }, 2000);
            }
            $scope.isProcessing = false;
            $rootScope.isProcessingxRs = false;  

            


          },function(error) {          
            $scope.isProcessing = false;
            $rootScope.isProcessingxRs = false;  
            $rootScope.errorCustomerFormxRs = error;
            setTimeout(function() {
                $rootScope.errorCustomerFormxRs = "";
            }, 2000);
        });
    };

    $scope.getDefaultServiceLevelData = function() {
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
    $rootScope.deleteAddress = function(customerModel, index){
        if(!customerModel.addressList[index].addressId){
            $rootScope.customerModel.addressList.splice(index, 1);
            $rootScope.adjustNgDialogHeight(); 
            return
        }       
    };

    
    $scope.customerFilterByStatus = function (type) {
        $scope.totalPage = 0;
        $scope.totalRecord = 0;
        $scope.currentPage = $scope.showingFrom = 1;
        let allFilterRemoved = Object.entries($scope.statusType).filter(function (item) {
            return item[1] == true
        })
        if (allFilterRemoved.length > 1 || !$scope.statusType[type]) {
            const index = $scope.selectedType.indexOf(type);
            const archived = $scope.selectedType.indexOf('Archive');
            if(archived == 0) {
                $scope.selectedType.splice(archived, 1);
            }
            if (index > -1) {
                $scope.selectedType.splice(index, 1)
            } else {
                $scope.selectedType.push(type);
            }
            if (type == 'Active') {
                if ($scope.statusType.Active) {
                    $scope.statusType.Active = false;
                    $scope.customerFilterStatus[type] = null;
                }
                else {
                    $scope.statusType.Active = true;
                    $scope.shownExcelReport = true;
                    $scope.customerFilterStatus[type] = type;
                    $scope.archiveCustomer = 0;
                    $scope.archiveStatus = false;
                }
            }
            else if (type == 'Active_noroute'){
                if ($scope.statusType.Active_noroute) {
                    $scope.statusType.Active_noroute = false;
                    $scope.customerFilterStatus[type] = null;
                }
                else {
                    $scope.statusType.Active_noroute = true;
                    $scope.shownExcelReport = true;
                    $scope.customerFilterStatus[type] = type;
                    $scope.archiveCustomer = 0;
                    $scope.archiveStatus = false;
                }
            }
            else if (type == 'Inactive') {
                if ($scope.statusType.Inactive) {
                    $scope.statusType.Inactive = false;
                    $scope.customerFilterStatus[type] = null;
                }
                else {
                    $scope.statusType.Inactive = true;
                    $scope.shownExcelReport = true;
                    $scope.customerFilterStatus[type] = type;
                    $scope.archiveCustomer = 0;
                    $scope.archiveStatus = false;
                }
            }
            else {
                if ($scope.statusType.Lead) {
                    $scope.statusType.Lead = false;
                    $scope.customerFilterStatus[type] = null;
                }
                else {
                    $scope.statusType.Lead = true;
                    $scope.shownExcelReport = true;
                    $scope.customerFilterStatus[type] = type;
                    $scope.archiveCustomer = 0;
                    $scope.archiveStatus = false;
                }
            }
            if ($scope.selectionsMade.length > 0) {
                $scope.selectionsMadeChanged();
            } else {
                $scope.getCustomerList();
            }
        }
    }

    $scope.showArchivedCustomers = function () {
        if($scope.archiveCustomer == 0){
            $scope.archiveCustomer = 1;
            $scope.customerFilterStatus = {
                Active: null,
                Inactive: null,
                Lead: null
            }
            $scope.statusType = { 'Active': false,'Active_noroute': false, 'Inactive': false, 'Lead': false };
            $scope.selectedType = ['Archive'];
        } else if($scope.archiveCustomer == 1){
            $scope.customerFilterStatus = {
                Active: 'Active',
                Active_noroute: 'Active_noroute',
                Inactive: 'Inactive',
                Lead: 'Lead'
            }
            $scope.shownExcelReport = true;
            $scope.archiveCustomer = 0;
            $scope.statusType = { 'Active': true,'Active_noroute': true, 'Inactive': true, 'Lead': true };
        }
        $scope.currentPage = $scope.showingFrom = 1;
        if ($scope.archiveCustomer == 0 && $scope.selectionsMade.length > 0) {
            $scope.selectionsMadeChanged();
        } else {
            $scope.getCustomerList();
        }
    }

    $scope.companyEmailforReports = auth.loggedInRole() != "administrator" ? auth.getSession().email : auth.getSession().companyEmail;    
    $scope.reportPageSentReportEmailModel = {
        email: ''
    }
    $scope.downloadEmailReport = function () {
        $scope.reportPageSentReportEmailModel.email = $scope.companyEmailforReports; 
        ngDialog.open({
            template: 'sentReportEmail.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {
                $scope.reportPageSelectedReportParams = {};
                $scope.reportPageSentReportEmailModel.email = $scope.companyEmailforReports;
                $scope.reportPageIsReportSending = false;
            }
        });
    }
      $scope.reportPageErrorMsg = '';
      $scope.sendReport = function() {
        $scope.reportPageIsReportSending = true;
        var sendReportParams = {
            email: $scope.reportPageSentReportEmailModel.email,
            reportType: 'customerType'
        }       
        apiGateWay.send('/send_email_reports', sendReportParams).then(function(response) {
            if (response.data.status == 200 && response.data.data.reportId) {
                $scope.reportPagereportGeneratingProcessStart = true;
                $scope.generateReportByReportId(response.data.data.reportId);
                setTimeout(function(){
                    $scope.reportPagereportGeneratingProcessStart = false;
                    $scope.reportPageIsReportSending = false;                       
                    ngDialog.closeAll();
                }, 2000)
            } else {
                $scope.reportPageErrorMsg = 'Some error occured. Please try again.';
                setTimeout(function(){
                    $scope.reportPageErrorMsg = '';
                }, 2000)
            }                     
        }, function(error){
            $scope.reportPageErrorMsg = typeof error == 'string' ? error : 'Something went wrong.';
            setTimeout(function(){
                $scope.reportPageErrorMsg = '';
            }, 2000)
            $scope.reportPageIsReportSending = false;
        });
    }
  
    $scope.generateReportByReportId = function(params) {      
      params = {
        reportId: params,
        Status: $scope.selectedType.join('-')
      }
      apiGateWay.send('/customer_email_report', params).then(function(response) {
      }, function(error){
      });
  }
    // dromo
    let companyId = auth.getSession().userType == "administrator" ? $rootScope.selectedCompany : $scope.companyId;
    let currEnvironment = configConstant.currEnvironment;
    let developmentMode = configConstant[currEnvironment].isDromoProduction == false;
    getDromoConfig.get(companyId).then(function(dromoConfig){  
        const pbprimaryColor = '#285fc6';
        const pbprimaryHoverColor = '#153f8d';
        const license = dromoConfig.dromo_access_key;
        const fields = [
            {
                "label": "Customer Name",
                "key": "customerName",
                "validators": [
                    {
                        "validate": "required"
                    },
                    {
                        "regex": "^.{2,}$",
                        "validate": "regex_match",
                        "errorMessage": "Must contain at least 2 characters."
                    }
                ]
            },
            {
                "label": "Address",
                "key": "address",
                "validators": [
                    {
                    "validate": "required"
                    }
                ]
            },
            {
                "label": "City",
                "key": "city",
                "validators": [
                    {
                    "validate": "required"
                    }
                ]
            },
            {
                "label": "State",
                "key": "state",
                "validators": [
                    {
                    "validate": "required"
                    }
                ]
            },
            {
                "label": "Zip Code",
                "key": "zipCode",
                "validators": [
                    {
                        "regex": "^(['0-9']+)$",
                        "validate": "regex_match",
                        "errorMessage": "Invalid Zipcode"
                    },
                    {
                        "validate": "required"
                    }
                ]
            },
            {
                "label": "Phone Number",
                "key": "phoneNumber",
                "validators": [                                
                    {
                        "regex": "^.{1,10}$",
                        "validate": "regex_match",
                        "errorMessage": "Invalid Phone Number"
                    }
                ]
            },
            {
                "label": "Email",
                "key": "emailAddress",
                "validators": [                
                    {
                        "regex": /^[^<>()[\]\\,;:\%#^\s@\"$&!@]+@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z0-9\d-_]+\.)+[a-zA-Z\d-_]{2,}))$/,
                        "validate": "regex_match",
                        "errorMessage": "Must be a valid email address"
                    },
                ]
            },
            {
                "label": "Gate Code",
                "key": "gateCode"
            },
            {
                "label": "Access Notes",
                "key": "accessNotes"
            },
            {
                "label": "Dog Info",
                "key": "hasDogs"           
            }
        ];
        const settings = {
            importIdentifier: "Customers",
            title: 'Import Bulk Customers',
            developmentMode: developmentMode,            
            styleOverrides : {   
                global: {
                    primaryTextColor: pbprimaryColor,
                    customFontURL: 'https://fonts.googleapis.com/css?family=Lato:300,300i,400,400i,700,700i,900,900i',
                    customFontFamily: "'Lato', sans-serif"
                },      
                primaryButton: {
                    backgroundColor: pbprimaryColor,
                    hoverBackgroundColor: pbprimaryHoverColor
                }
            }
        };
        const user = {
            id: "1"
        };
        $scope.dromo = new DromoUploader(license, fields, settings, user);           
        $scope.dromo.onResults(function (response, metadata) {
            let b = document.getElementsByTagName('body')[0]
            b.click();
            if (response && response.length > 0) {
                $scope.bulkCustomerAdding = true;   
                $scope.dromoError = '';     
                $scope.addBulkCustomers(response);
            }
            return "Done!";
        });
    }) 
    $scope.bulkCustomerAdding = false;
    $scope.dromoError = '';
    $scope.dromoSuccess = '';
    $scope.dromoMaxCustomers = configConstant[currEnvironment].dromoCustomerImportChunkSize;
    $scope.progressPercent = 0;
    $scope.progressInterval = null;
    $scope.addBulkCustomers = (data) => {
        $scope.bulkCustomerAdding = true;        
        const chunkedCustomers = [];
        for (let i = 0; i < data.length; i += $scope.dromoMaxCustomers) {
            const customer = data.slice(i, i + $scope.dromoMaxCustomers);
            chunkedCustomers.push(customer);
        }        
        function saveChunkedCustomers(index) {            
            var isFinalHit = index === chunkedCustomers.length - 1;
            if (index < chunkedCustomers.length) {
                const payLoad = {
                    data: chunkedCustomers[index],
                    isFinalHit: isFinalHit
                };
                apiGateWay.send("/add_bulk_customers", payLoad).then(function (response) {
                    if(response.data.status == 200) {                        
                        if (isFinalHit) {
                            $scope.progressPercent = 100;                            
                            setTimeout(function(){
                                $scope.dromoSuccess = 'Customers Imported successfully';
                                setTimeout(function(){
                                    $scope.dromoSuccess = '';
                                }, 1000)
                                $scope.bulkCustomerAdding = false;
                                $scope.progressPercent = 0;
                                $scope.totalPage = 0;
                                $scope.totalRecord = 0;
                                $scope.currentPage = 1;
                                $scope.getCustomerList();
                            }, 500)                            
                        } else {
                            $scope.progressPercent = Math.ceil(((index + 1) / chunkedCustomers.length) * 100);                                                  
                            saveChunkedCustomers(index + 1);
                        }
                    }              
                }, function (error) {
                    $scope.bulkCustomerAdding = false;
                    $scope.progressPercent = 0;
                    $scope.dromoError = 'Something went wrong. Please try again.';
                    setTimeout(function(){
                        $scope.dromoError = '';
                    }, 1000)
                })
            }
        }
        saveChunkedCustomers(0);                
    }
    //   dromo
    $scope.showFilter = function(){
        if($scope.showFilterBox){
            $scope.showFilterBox = false;
            return;
        }

        $scope.showFilterBox = true;
        document.onclick = function(e){
            if(e.target.id == 'backgroundOverlay'){
                $scope.showFilterBox = false;
            }
        }
    }
    $scope.filterPayloadQueryTypes = [
        { id: 'and', label: 'All'},
        { id: 'or', label: 'Any'},
    ];
    $scope.selectedFilterPayloadQueryType = $scope.filterPayloadQueryTypes[0];
    $scope.filterPayloadQueryType = function(type) {
        $scope.selectedFilterPayloadQueryType = type;
        $scope.currentPage = $scope.showingFrom = 1;
        $scope.selectionsMadeChanged();
    }
    $scope.initCustomerFilter = function() {
        if ($scope.filterInitiated) return;
        $scope.filterInitiated = true;
        $scope.closeAllFilterDropdown();
        $scope.getFilterMasterForCustomer('all');
        $scope.getFilterMasterForCustomer('city');
        $scope.getServiceLevelData();
        $scope.fetchRoutes();
    };
    
    $scope.equipmentDropdownStatus = {};
    $scope.toggleEquipmentDropdown = function(id) {
        if($scope.equipmentDropdownStatus[id]) {
            $scope.equipmentDropdownStatus[id] = false;
            return
        }
        $scope.equipmentDropdownStatus = {};
        $scope.equipmentDropdownStatus[id] = true;
    }
    $scope.closeEquipmentDropdown = function() {        
        $scope.equipmentDropdownStatus = {};
    }
    $scope.ecpDropwDownOpen = {};
    $scope.toggleEcpDropDown = function(id) {
        if($scope.ecpDropwDownOpen[id]) {
            $scope.ecpDropwDownOpen[id] = false;
            return
        }
        $scope.ecpDropwDownOpen = {};
        $scope.ecpDropwDownOpen[id] = true;
        if (id == 'route') {
            $scope.fetchRoutes();
        }
    }    
    $scope.closeEcpDropDown = function() {
        $scope.ecpDropwDownOpen = {};
    }    
    $scope.closeAllFilterDropdown = function(){
        $scope.closeEcpDropDown();
        $scope.closeEquipmentDropdown();
    }
    
    $scope.getFilterMasterForCustomer = function(type) {
        if ($scope.isMasterFilterFetched[type]) {
            return
        }
        let session = auth.getSession();
        let companyId = session.companyId;
        $scope.equipments = []; 
        $scope.isFilterMasterLoading[type] = true;
        $scope.masterFilterLoading = true;
        apiGateWay.get("/get_email_filter_data", {
            companyId: companyId,
            type: type
        }).then(function(response) {
            if (response.data.status == 200) { 
                let resData = response.data.data; 
                $scope.isMasterFilterFetched[type] = true;
                $scope.parseMasterFilterData(resData, type)                
            }
            $scope.isFilterMasterLoading[type] = false;
            $scope.masterFilterLoading = false;
        }, function(error) {
            $scope.isFilterMasterLoading[type] = false;            
        });
    }
    
    $scope.parseMasterFilterData = function(resData, type) {
        if (type == 'all') {
            $scope.equipments = resData.equipments ? resData.equipments : [];                
            $scope.customerStatusProps = angular.copy(resData.customerStatus)
            resData.customerStatus = Object.keys(resData.customerStatus)  
            $scope.getStatusName = {};                              
            resData.customerStatus.forEach(function(s){            
                $scope.getStatusName[s] = $scope.convertedStatusNames[s] ? $scope.convertedStatusNames[s] : s
            })
            resData.invoiceStatus = Object.keys(resData.invoiceStatus);       
            $scope.invoiceStatuses = resData.invoiceStatus && resData.invoiceStatus.length > 0 ? $scope.parseFilterData(resData.invoiceStatus,'invoiceStatus') : [];
            $scope.zipCodesMaster = resData.zipcode && resData.zipcode.length > 0 ? $scope.parseFilterData(resData.zipcode,'zip') : [];
            $scope.citiesMaster = resData.citys && resData.citys.length > 0 ? $scope.parseFilterData(resData.citys,'city') : [];                  
            let allTags = [];
            if (resData.tags && resData.tags.length > 0) {
                let _tags = resData.tags;
                _tags.forEach(function(tag){
                    let formattedTag = tag.trim();
                    if (!allTags.some(existingTag => existingTag.toLowerCase() === formattedTag.toLowerCase())) {
                        allTags.push(formattedTag);
                    }
                });
            }
            $scope.tagsMaster = $scope.parseFilterData(allTags,'tag');
        } else if (type == 'city') {
            $scope.zipCodesMaster = resData.zipcode && resData.zipcode.length > 0 ? $scope.parseFilterData(resData.zipcode,'zip') : [];
            $scope.citiesMaster = resData.citys && resData.citys.length > 0 ? $scope.parseFilterData(resData.citys,'city') : [];
        }        
    }
    $scope.parseFilterData = function(data, type) {   
        let arr = [];     
        if (data && data.length > 0){
            data.forEach(function(item){                       
                if (item != '' && item != undefined && item != null) {                    
                    let _obj = {
                        label: type == 'status' && $scope.getStatusName[item] ? $scope.getStatusName[item] : item,
                        id: item,
                        selectionType: type,
                        labelSuffix: $scope.getLabelSuffixName(type)
                    }
                    arr.push(_obj);
                }                               
            })
        }
        return arr;
    }
    $scope.convertedStatusNames = {
        "Active_noroute" : "ACTIVE (no route)",
        "Active_routed" : "ACTIVE (routed)",
        "Inactive" : "INACTIVE",
        "Lead" : "LEAD"
    } 
    $scope.getLabelSuffixName = function(type) {
        let labelSuffix = '';
        if (type == 'tag') labelSuffix = 'Tag'
        if (type == 'invoiceStatus') labelSuffix = 'Invoice'
        if (type == 'invoiceStatus') labelSuffix = 'Invoice'
        return labelSuffix
    }
    $scope.getServiceLevelData = function() {
        apiGateWay.get("/get_service_level").then(function(response) {
            if(response.status == 200) {
              level = $rootScope.sortServiceLevel(response.data.data.serviceLevel, 'serviceLevel');
              $scope.serviceLevelArray = level;
            }
          },function(error){
            $scope.serviceLevelArray = [];
          });
    }
    $scope.fetchRoutes = function() {
        const hasData = $scope.routesCache.find(item => item.date === $scope.routeListDate.format('YYYY-MM-DD'));
        if (hasData) {
            $scope.routes = hasData.routes;
            $scope.isRoutesLoading = false;
            return
        }
        $scope.isRoutesLoading = true;
        let endpoint = '/route_list';
        var currEnvironment = configConstant.currEnvironment;
        var apiUrl = configConstant[currEnvironment].server;        
        var pr = pendingRequests.get();        
        if (pr.length > 0) {
            pr.forEach(function(r){
                if (r.url === apiUrl + endpoint) {
                    r.canceller.resolve();
                }
            })
        }     
        clearInterval($scope.fetchRoutesInterval);
        $scope.fetchRoutesInterval = setTimeout(function(){  
            $scope.routes =[];          
            let payload = {
                date: $scope.routeListDate.format('YYYY-MM-DD')
            }
            apiGateWay.get(endpoint, payload).then(function(response) { 
                if (response.data.status == 200) {
                    let routes = [];
                    let routeResponse = response.data.data;
                    if (routeResponse && routeResponse.length > 0) {
                        routeResponse.forEach(function(route){
                            routes.push({
                                label: route.title,
                                id: route.id,
                                color: route.color,
                                userImage: route.userImage ? route.userImage : null,
                                techFirstname: route.techFirstname,
                                techLastname: route.techLastname,
                                technicianId: route.technicianId,
                                date: payload.date,
                                labelSuffix: 'Route'
                            })
                        })
                    }
                    $scope.routes = routes;
                    $scope.routesCache.push({
                        date: $scope.routeListDate.format('YYYY-MM-DD'),
                        routes: routes
                    })
                }
                $scope.isRoutesLoading = false;
            }, function(error) {
                $scope.isRoutesLoading = false;
            })
        }, 200)       
    }
    $scope.modifyRouteListDate = function(diretion) {
        let input = document.querySelector('#searchRoute')
        if (input) {
            input.value = '';
        }
        $scope.routes = [];
        $scope.isRoutesLoading = true;
        if (diretion == 'left') {
            $scope.routeListDate = $scope.routeListDate.subtract(1, 'days');
        }
        if (diretion == 'right') {
            $scope.routeListDate = $scope.routeListDate.add(1, 'days');
        }
        $scope.fetchRoutes();
    }            
    $scope.addToSelections = function(data, type) {
        let selectionId = (type == 'serviceLevel') ? data.serviceLevel.id : data.id;
        let selectionLabel = '';
        selectionLabel = (type == 'serviceLevel') ? data.serviceLevel.title : `<b>`+data.label+`</b>`;
        selectionLabel = data.labelSuffix ? `<span>`+data.labelSuffix+` : </span>` + selectionLabel : selectionLabel;               
        selectionLabel = data.labelPrefix && data.labelPrefix != ' ' ? selectionLabel + ` <span>(`+data.labelPrefix+`)</span>` : selectionLabel;               
        let alreadyExists = $scope.selectionsMade.some(selection => selection.selectionId === selectionId);
        if (!alreadyExists) {   
            let selectionItem = {
                uid: $scope.generateSelectionId(),
                selectionType: type,
                selectionId: selectionId,
                selectionLabel: selectionLabel,
            }
            if (type=='routes') {
                selectionItem.date = data.date
            }  
            $scope.selectionsMade.push(selectionItem);
            $scope.totalPage = $scope.totalRecord = 0;
            $scope.currentPage = $scope.showingFrom = 1;
            $scope.selectionsMadeChanged();
            return true;
        } else {            
            let alreadyExistSelectionTag = $scope.selectionsMade.find(smtag => smtag.selectionId === selectionId);
            alreadyExistSelectionTag.alreadyExist = true;
            $timeout(function() {
                alreadyExistSelectionTag.alreadyExist = false;
            }, 100);
            return false;
        }  
    }
    $scope.removeFromSelections = function(uid) {
        if (uid == 'all' && $scope.selectionsMade.length > 0) {
            $scope.selectionsMade = [];
            $scope.totalPage = $scope.totalRecord = 0;
            $scope.currentPage = $scope.showingFrom = 1;
            $scope.getCustomerList();
        } else {            
            const indexToDelete = $scope.selectionsMade.findIndex(selection => selection.uid === uid);
            if (indexToDelete !== -1) {
                $scope.selectionsMade.splice(indexToDelete, 1);
                $scope.totalPage = $scope.totalRecord = 0;
                $scope.currentPage = $scope.showingFrom = 1;
                $scope.selectionsMadeChanged();
                return true;
            } else {
                return false;
            }
        }
    }
    $scope.generateSelectionId = function() {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 8);
        return timestamp + randomStr;
    }
    $scope.filterList = function(inputId, listId) {
        var input, filter, ul, li, a, i, txtValue;
        input = document.getElementById(inputId);
        filter = input.value.toLowerCase();
        ul = document.getElementById(listId);
        li = ul.getElementsByTagName('li');
        var found = false;
        for (i = 0; i < li.length; i++) {
            txtValue = li[i].textContent || li[i].innerText;
            if (txtValue.toLowerCase().indexOf(filter) > -1) {
                li[i].style.display = '';
                found = true;
            } else {
                li[i].style.display = 'none';
            }
        }        
        var noResults = ul.querySelector('#' + listId + ' .no-results-found-li');
        if (noResults) {
            ul.removeChild(noResults);
        }        
        if (!found && filter.length > 0) { 
            var noResults = document.createElement('li');
            let ulname = 'records';
            if (listId == 'cityList') ulname = 'city';
            if (listId == 'zipCodeList') ulname = 'zipcode';
            if (listId == 'tagList') ulname = 'tag';
            if (listId == 'routeList') ulname = 'route';
            noResults.textContent = 'No '+ulname+' found';
            noResults.classList.add('no-results-found-li'); 
            noResults.setAttribute('data-no-found-ul', ulname); 
            ul.appendChild(noResults);
        }
    }
    
    $scope.getFilteredCustomers = function() {
        let customerFilterPayload = {
            column: $scope.customerSortColumn,
            dir: $scope.customerSortDir,
            length: $scope.limit,
            page: $scope.currentPage - 1,
            ...$scope.getFiltersPayLoad()
        };
        let endpoint = '/customer_filter';
        var currEnvironment = configConstant.currEnvironment;
        var apiUrl = configConstant[currEnvironment].server;        
        var pr = pendingRequests.get();
        if (pr.length > 0) {
            pr.forEach(function(r){
                if (r.url === apiUrl + endpoint) {                    
                    r.canceller.resolve()
                    return
                }
            })
        }
        $scope.isProcessing = true;
        apiGateWay.send(endpoint, customerFilterPayload).then(function(response) {
            if (response.data.status == 200) {
                var customerListResponse = response.data.data;
                $scope.totalRecord = customerListResponse.rows;
                $scope.totalPage = ($scope.totalRecord % $scope.limit) !== 0 ? parseInt($scope.totalRecord / $scope.limit) : parseInt(($scope.totalRecord / $scope.limit)) - 1;
                $scope.customerList = customerListResponse.data;
                if (!$scope.ifCustomerExists && $scope.customerList.length > 0) {
                    $scope.ifCustomerExists = true;
                }
                if (customerListResponse) {
                    $scope.counts = {
                        activeRouteCustomers: customerListResponse.activeRoute,
                        activeNoRouteCustomers: customerListResponse.activeNoRoute,
                        inActiveCustomer: customerListResponse.inActive,
                        leadCustomer: customerListResponse.lead
                    }
                }
            } else {
                $scope.customerList = [];
                $scope.ifCustomerExists = false;
            }
            $scope.isProcessing = false;
        }, function(error) {
            $scope.isProcessing = false;            
        });
    }
    $scope.getFiltersPayLoad = function(){
        let equipmentTypeId = $scope.getSelectionsForPayLoad('equipment');            
        let zipcode = $scope.getSelectionsForPayLoad('zip');
        let city = $scope.getSelectionsForPayLoad('city');
        let customerStatus = $scope.getSelectionsForPayLoad('status');
        customerStatus = $scope.replaceCustomerStatusWithID(customerStatus)
        let invoiceStatus = $scope.getSelectionsForPayLoad('invoiceStatus');
        let tags = $scope.getSelectionsForPayLoad('tag');
        let routes = $scope.getSelectionsForPayLoad('routes');
        let primaryAddress = $scope.contactType == 'both' || $scope.contactType == 'primary' ? 1 : 0;
        let billingAddress = $scope.contactType == 'both' || $scope.contactType == 'billing' ? 1 : 0;
        let serviceLevelId = $scope.getSelectionsForPayLoad('serviceLevel');
        let filerPayload = {
            equipmentTypeId: equipmentTypeId,
            zipcode: zipcode,
            city: city,
            customerStatus: customerStatus,
            invoiceStatus: invoiceStatus,
            tags: tags,
            routes: routes,
            primaryAddress: primaryAddress,
            billingAddress: billingAddress,
            queryMode: $scope.selectedFilterPayloadQueryType.id,
            serviceLevelIds: serviceLevelId
        }
        return filerPayload
    }
    $scope.replaceCustomerStatusWithID = function(customerStatus) {
        let _customerStatus = [];
        if (customerStatus && customerStatus.length > 0) {
            customerStatus.forEach(function(status){
                _customerStatus.push($scope.customerStatusProps[status == 'Active' ? 'Active_routed': status]);
            })
        }        
        return _customerStatus
    }
    $scope.getSelectionsForPayLoad = function(type) {
        let _selection = [];
        if (type == 'status') {
            Object.keys($scope.statusType).forEach(function(key) {
                if ($scope.statusType[key]) {
                    _selection.push(key);
                }
            });
            return _selection;
        }
        if ($scope.selectionsMade && $scope.selectionsMade.length > 0) {
            $scope.selectionsMade.forEach((eq)=>{
                if (eq.selectionType==type) {
                    if (type=='routes') {
                        let payloadItem = {
                            id: eq.selectionId,
                            date: eq.date
                        }
                        _selection.push(payloadItem)
                    } else {
                        _selection.push(eq.selectionId)
                    }
                }
            })
        }
        return _selection;
    }
    
    $scope.selectionsMadeChanged = function() {
        $scope.getFilteredCustomers();   
    }
});
