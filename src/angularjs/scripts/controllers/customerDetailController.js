angular.module('POOLAGENCY').controller('customerDetailController', function($scope,$state, deviceDetector, $timeout, $rootScope, $filter, $sce, apiGateWay, service, $stateParams, ngDialog,Analytics, configConstant, auth,) {
    $scope.isPropertyInformation = configConstant[configConstant.currEnvironment].isPropertyInformation;
    $scope.isServiceSchedule = configConstant[configConstant.currEnvironment].isServiceSchedule;
    $scope.addressId = $stateParams.addressId;
    $scope.customerId = "";
    $scope.selectDate = '';
    $scope.currentPage = 1;
    $scope.limit = 10;
    $scope.dir = 'desc';
    $scope.column = 'createTime';
    $scope.isProcessing = false;
    $scope.isEditCustomer = false;
    $scope.isEditAddress = [];
    $scope.isEditContact = [];
    $scope.jobType="complete";
    $scope.showAllPropertiesJob = {value:0};
    $scope.addressList=[];
    $scope.contactList=[];
    $scope.emailError = false;
    $scope.jobTypes = [{ key: 'chemical', value: 'Chemical Only'}, {key: 'complete',value: 'Full Service'}];
    $scope.displayName = "";
    $scope.firstName = "";
    $scope.lastName = "";
    $scope:searchKey = "";
    $rootScope.custAddrDetailsData = {};
    $scope.updateCoordinateBox = []
    $scope.latLongBox = []
    $scope.contactFormClose = false;
    $scope.currentUser = auth.getSession();
    $scope.feedbackList = [];
    $scope.currentPageFb = 1;
    $scope.totalPageFb = 0;
    $scope.totalRecordFb = 0;
    $scope.pageFb = 1;
    $scope.searchTextFb = '';
    $scope.showfuturedata = 1;
    $scope.feedbackPayload = {
        page: $scope.currentPageFb - 1,
        length: $scope.limit,
        dir: $scope.dir,
        column: $scope.column,
        addressId: $scope.addressId,
        showAllProperties: $scope.showAllPropertiesJob.value,
        showAll: true,
        searchText: $scope.searchTextFb,
        showfuturedata: $scope.showfuturedata,
    };
    $scope.customerTags = [];
    // email popup feature
    $scope.companyEmailforReports = auth.loggedInRole() != "administrator" ? auth.getSession().email : auth.getSession().companyEmail;    
    $scope.reportPageSelectedReportParams = {};
    $scope.reportPageIsReportSending = false;
    $scope.reportPagereportGeneratingProcessStart = false;
    $scope.reportPageSentReportEmailModel = {
        email: ''
    };
    $rootScope.listingTab = {
        jobHistory:true,
        invoice:false
    };
    $scope.isActive = '';
    $scope.rangeFilterData = [
        {'title': 'CUSTOM', value: true, type: 'custom' },
        {'title': '1 MONTH', value: 1, type: 'month' },
        {'title': '6 MONTHS', value: 6, type: 'month' },
        {'title': '90 DAYS', value: 90, type: 'days' },
        {'title': '1 YEAR', value: 1, type: 'year' },
    ]
    $scope.filterRangeSelected = 3;
    $scope.togglePrimartEmailEdit = function(){
      $scope.addNewEmail = !$scope.addNewEmail;
    }
    $scope.$on("$destroy", function () {
        $rootScope.getJobDetailByWaterBody = null;
        $rootScope.customerAutomatedEmailOn = null;
    })
    $scope.jobFilter = {
        'RoutedJob' : true,
        'OneOfJob' : true
    }
    $scope.jobFilterFb = {
        'RoutedJob' : true,
        'OneOfJob' : true
    }
    $scope.searchText = ""
    $scope.hideShowDatesText = 'Hide future dates';
    $scope.hideShownDatesText = true;
    $scope.buttonDisabled = false;    
   var cn = /^([a-zA-Z0-9 '._-]+)$/;
   $scope.checkName = function(displayName){
    if(displayName){
        return cn.test(String(displayName).toLowerCase());
    }else{
      return true;
    }
  }

  $scope.search = function (row) {
    return (angular.lowercase(row.address).indexOf(angular.lowercase($scope.searchKey.replace('  ', '')) || '') !== -1 ||
            angular.lowercase(row.city).indexOf(angular.lowercase($scope.searchKey.replace('  ', '')) || '') !== -1 || angular.lowercase(row.state).indexOf(angular.lowercase($scope.searchKey.replace('  ', '')) || '') !== -1 || angular.lowercase(row.zipcode).indexOf(angular.lowercase($scope.searchKey.replace('  ', '')) || '') !== -1);
};



    $rootScope.showQBOLogs = function(){
        $scope.getCustomerQBOLogs($scope.addressId);  
        setTimeout(function() {
            ngDialog.open({
                template: 'templates/component/qbo-sync-log.html?ver=' + $rootScope.PB_WEB_VERSION,
                className: 'ngdialog-theme-default v-center',
                overlay: true,
                closeByNavigation: true,
                closeByDocument: true,
                scope: $scope,
                preCloseCallback: function() {              
                
                }
            });        
        }, 1000); 
    }  
    
    $rootScope.deleteCustomerConfirm = function(){  
            $scope.addInvoicePopup = ngDialog.open({            
                template: 'deleteCustomerConfirm.html',
                className: 'ngdialog-theme-default v-center',
                overlay: true,
                closeByNavigation: true,
                scope: $rootScope,
                preCloseCallback: function () {
                }
            });   
    }

    $rootScope.activeCustomerConfirm = function(){  
        $scope.addInvoicePopup = ngDialog.open({            
            template: 'activeCustomerConfirm.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $rootScope,
            preCloseCallback: function () {
            }
        });   
    }

    $rootScope.activeCustomer = function(){  
        $scope.isDelete = null;
        $rootScope.deleteCustomer();
    }

    $rootScope.deleteCustomer = function(){
        $scope.isDeleting = true;
        apiGateWay.send("/archive_customer", {
            "customerId": $scope.customerId,
            'isDelete': $scope.isDelete
        }).then(function(response) {
            if (response.status == 200) {
                $scope.addInvoicePopup.close();
                setTimeout(function() {
                    $scope.successMsg = false;
                    $scope.isDeleting = false;
                    if($scope.isDelete != null) {
                        $state.go("app.customer", {}, { reload: true});
                    }
                    else {
                        $rootScope.changeCustomerStatus($scope.currentAddressId);
                        $scope.getCustomerInfo();
                        $rootScope.getEquipmentDetails();
                    }
                }, 2000)
            }            
            $scope.successMsg = response.data.message;
        }, function(error){            
            $scope.addInvoicePopup.close();
            if(error.message!=""){$scope.error = error;}else{$scope.error = 'Something went wrong';}
            setTimeout(function() {
                $scope.error = "";
            }, 2000);
            $scope.isDeleting = false;
        })
    };
    
    $scope.getCustomerQBOLogs = function(addressId) {
        $scope.isProcessing = true;
        apiGateWay.get("/customer_qbo_logs", {
            addressId: addressId
        }).then(function(response) {
            if (response.data.status == 200) {
                $scope.auditLogList = response.data.data; 
            }
            $scope.isProcessing = false;
            
        },function(error) {
            $scope.isProcessing = false;
            $scope.error = error;
            setTimeout(function() {
                $scope.error = "";
            }, 1000);
        });
    };
    $scope.getHContent = (data) => {        
        let newData = [];
        let _html = '<div class="address-qb-log-update-list">';
        angular.forEach(data, function(value, key) {
            newData.push({
                property: key,
                old: value.old,
                new: value.new
            });
        });
        newData.map(function(item){
            _html += '<div class="address-qb-log-update-list-item"><b> Updated </b> ' + item.property + ' from ' + item.old + ' to ' + item.new + '</div>';
        })
        _html += '</div>'
        return newData.length > 0 ? _html : '';
    }
    $scope.parseLog= function(log){
       let auditLog = JSON.parse(log);
      
        return auditLog;
    }
    $scope.parseAddressLog= function(log){
        let auditLog='';
        for (alog in JSON.parse(log)) {
            if(JSON.parse(log)[alog]){
                if(auditLog!=''){
                    auditLog =  auditLog +", "+JSON.parse(log)[alog];
                }else{
                    auditLog =  JSON.parse(log)[alog];
                }
            }
          }
         return auditLog;
     }
    
  $scope.saveCustomer = function(displayName){
    if(displayName){
        $scope.isProcessing = true;
        var customerModel = {
            'displayName':displayName,
            'customerId':$scope.customerId,
            'email':$scope.customerinfo.customer.email,
            'contactNumber':$scope.customerinfo.customer.contactNumber,
            'addressList':"",
            };
        apiGateWay.send("/manage_displayname", customerModel).then(function(response) {           
            if (response.data.status == 200) {
                $scope.getCustomerShortInfo($scope.addressId);
                //$scope.getCustomerContactList($scope.customerId);    
            } 
            $scope.isEditCustomer =false;
            $scope.isProcessing = false;
          },function(error) {
            $scope.isProcessing = false;
            $scope.errorCustomerForm = error;
            setTimeout(function() {
                $scope.errorCustomerForm = "";
            }, 1000);
        });
    }else{
        
    }
    
    }

    $scope.showTab = function(tab){
        $scope.tab = [false, false, false, false, false];

        if(tab == 0 || tab == 1 || tab == 2 || (tab == 3 && $rootScope.customerBillingData.terms != undefined) || tab == 4) {
            $scope.tab[tab] = true;
        }

        $scope.searchKey = "";
    }
    $scope.showEditCustForm = function(){
        $scope.isEditCustomer = true;
    }
    $scope.hideEditCustForm = function(){
        $scope.isEditCustomer = false;
    }
    var re = /^(([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,}|[0-9]{1,3})(\]?)(\s*(;|,)\s*|\s*$))*$/;
    $scope.checkEmail = function(primaryEmail){
        let isEmailOk = true;        
        if (primaryEmail) {
            isEmailOk = re.test(String(primaryEmail).toLowerCase());
            if (isEmailOk) {
                let t = primaryEmail.replace(/ /g,'');
                if(t.endsWith(',')) {
                    isEmailOk = false
                }
            }
        }
        return isEmailOk
    }
    $scope.savePrimaryEmail = function(email){
      let isEmailOk = true;
      if (email) {
          isEmailOk = re.test(String(email).toLowerCase());
          if (isEmailOk) {
              let t = email.replace(/ /g,'');
              if(t.endsWith(',')) {
                  isEmailOk = false
              }
          }
      }              
      if($scope.customerinfo && email != $scope.customerinfo.customer.primaryEmail && isEmailOk){
        $scope.isProcessing = true; 
        if (email) {
            email = email.replace(/\s\s+/g, ' ')
        }       
        var addPrimaryEmail = {"primaryEmail":email,"addressId":$scope.addressId}
        apiGateWay.send("/save_primary_email", addPrimaryEmail).then(function(response) {

            if (response.data.status == 201) {
                $scope.successMsg = response.data.message;
                $scope.customerinfo.customer.primaryEmail = email;
                $scope.addNewEmail = false;
                $scope.primaryEmail = email;
            } else {
                $scope.successMsg = '';
                $scope.error = response.data.message;
            }
            $scope.isProcessing = false;
            setTimeout(function() {
                $scope.error = '';
                $scope.successMsg = '';
                $scope.isProcessing = false;
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);
        }, function(error) {

            var msg = 'Error';
            if (typeof error == 'object' && error.data && error.data.message) {
                msg = error.data.message;
            } else {
                msg = error;
            }
            $scope.successMsg = '';
            $scope.error = msg;
            $scope.isProcessing = false;
            setTimeout(function() {
                $scope.error = '';
                $scope.isProcessing = false;
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);
        });
      }
    }

    $scope.setTitle = function (alertType) {
        var selectedTabName = alertType;
        if (alertType == 'WaterLevelLow') {
            selectedTabName = 'Water Level Low';
        } else if (alertType == 'GreenPool') {
            selectedTabName = 'Algae';
        } else if (alertType == 'NoPower') {
            selectedTabName = 'No Power';
        } else if (alertType == 'SystemDown') {
            selectedTabName = 'System Down';
        } else if (alertType == 'NoAccess') {
            selectedTabName = 'No Access';
        } else if (alertType == 'Weather') {
            selectedTabName = 'Weather';
        } else if (alertType == 'RepairNeeded') {
            selectedTabName = 'Repair Needed';
        } else if (alertType == 'Other') {
            selectedTabName = 'Other Issue';
        }
        return selectedTabName;
    };

    $scope.updateJobType=function(){
        $scope.isProcessing = true;
        var jobType = $scope.activityModel.jobType ? "chemical" : "complete";
        var jobTypeModel = {"jobType":jobType,"addressId":$scope.addressId}
        apiGateWay.send("/address_sync", jobTypeModel).then(function(response) {
            if (response.data.status == 201) {
                $scope.successMsg = response.data.message;
            } else {
                $scope.successMsg = '';
                $scope.error = response.data.message;
            }
            $scope.isProcessing = false;
            setTimeout(function() {
                $scope.error = '';
                $scope.successMsg = '';
                $scope.isProcessing = false;
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);
        }, function(error) {
            var msg = 'Error';
            if (typeof error == 'object' && error.data && error.data.message) {
                msg = error.data.message;
            } else {
                msg = error;
            }
            $scope.successMsg = '';
            $scope.error = msg;
            $scope.isProcessing = false;
            setTimeout(function() {
                $scope.error = '';
                $scope.isProcessing = false;
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);
        });

    }


    $scope.saltSystemData = {
        "active": "Active Salt System",
        "present": "Present but Non-Functional",
        "no": "No Salt System"
    };
    
    //to save install detail
    $scope.saveInstall = function() {
        if ($scope.saveInstallForm.$valid) {
            $scope.isProcessing = true;

            var params = angular.copy($scope.activityModel);
            params['saltSystem'] = params['saltSystem'] ? 'active' : 'no';
            var activityModel = $scope.activityModel;
            apiGateWay.send("/installer_details", {
                "postData": params
            }).then(function(response) {
                if (response.data.status == 201) {
                    //$scope.getInstallHistory($scope.installer.installerId, $scope.activityModel.jobId);
                    $scope.error = '';
                    $scope.installDetail.gallonage = $scope.activityModel.gallanogeCalculated || $scope.activityModel.gallanogeCalculated == 0 ? parseFloat($scope.activityModel.gallanogeCalculated) : null;
                    $scope.installDetail.installerTrackingId = $scope.activityModel.galId;
                    $scope.installDetail.saltSystem = $scope.activityModel.saltSystem;

                    if($scope.activityModel && !$scope.activityModel.jobId){
                        $scope.getCustomerInfo();
                    }
                    $scope.successMsg = response.data.message;
                } else {
                    $scope.successMsg = '';
                    $scope.error = response.data.message;
                    var analyticsData = {};
                    analyticsData.requestData = $scope.activityModel;
                    analyticsData.userData = $rootScope.userSession;
                    analyticsData.actionTime = new Date();
                    analyticsData.errorData = response.data;
                    var analyticsDataString = JSON.stringify(analyticsData);
                    var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                    $rootScope.storeAnalytics('Error - Save Install', "Error on saveInstall - " + currentDateTime, analyticsDataString, 0, true);
                }
                $scope.isProcessing = false;
                setTimeout(function() {
                    $scope.error = '';
                    $scope.successMsg = '';
                    $scope.isProcessing = false;
                }, 2000);
            }, function(error) {
                var msg = 'Error';
                if (typeof error == 'object' && error.data && error.data.message) {
                    msg = error.data.message;
                } else {
                    msg = error;
                }
                var analyticsData = {};
                analyticsData.requestData = $scope.activityModel;
                analyticsData.userData = $rootScope.userSession;
                analyticsData.actionTime = new Date();
                analyticsData.errorData = error;
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Error - Save Install', "Error on saveInstall - " + currentDateTime, analyticsDataString, 0, true);
                $scope.successMsg = '';
                $scope.error = msg;
                setTimeout(function() {
                    $scope.error = '';
                    $scope.isProcessing = false;
                }, 2000);
            });
        }
    }


    $scope.assignSerivceLevel = function(id,title){
        $scope.isProcessing = true;
        var serviceLevelData = {"id":id,"addressId":$scope.addressId}
        apiGateWay.send("/assign_servicelevel", serviceLevelData).then(function(response) {
            if (response.data.status == 200) {
                $scope.assignedSL.serviceLevelId = id;
                $scope.assignedSL.title = title;
                $scope.successMsg = response.data.message;
                $scope.checkListArray = response.data.data.checkList;
            } else {
                $scope.successMsg = '';
                $scope.error = response.data.message;
            }
            $scope.isProcessing = false;
            setTimeout(function() {
                $scope.error = '';
                $scope.successMsg = '';
                $scope.isProcessing = false;
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);
        }, function(error) {

            var msg = 'Error';
            if (typeof error == 'object' && error.data && error.data.message) {
                msg = error.data.message;
            } else {
                msg = error;
            }
            $scope.successMsg = '';
            $scope.error = msg;
            $scope.isProcessing = false;
            setTimeout(function() {
                $scope.error = '';
                $scope.isProcessing = false;
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);
        });
    }
    

    $scope.getCustomerJobList = function() {
        $scope.isProcessing = true;
        var jobParam = {
            page: $scope.currentPage - 1,
            length: $scope.limit,
            dir: $scope.dir,
            column: $scope.column,
            addressId: $scope.addressId,
            showAllProperties: $scope.showAllPropertiesJob.value,
            showAll: true,
            searchText: $scope.searchText,
            showfuturedata: $scope.showfuturedata
        };
        $scope.page = $scope.currentPage

        dateType = $scope.rangeFilterData[$scope.filterRangeSelected].type
        if (dateType == 'custom' && $scope.fromDate != '' && $scope.toDate != '') {
            jobParam.startDate = $filter('date')(new Date($scope.fromDate), 'yyyy-MM-dd');
            jobParam.endDate = $filter('date')(new Date($scope.toDate), 'yyyy-MM-dd');
        } else {
            dateValue = $scope.rangeFilterData[$scope.filterRangeSelected].value
            if(dateType != 'custom') {
                jobParam.startDate = $filter('date')(new Date(moment().subtract(dateValue, dateType)), 'yyyy-MM-dd');
                jobParam.endDate = $filter('date')(new Date(moment()), 'yyyy-MM-dd');
            }
        }

        if($scope.jobFilter.RoutedJob == false && $scope.jobFilter.OneOfJob == true){
            jobParam.isOneOfJob = 1
        }
        if($scope.jobFilter.RoutedJob == true && $scope.jobFilter.OneOfJob == false){
            jobParam.isOneOfJob = 0 
        }

        apiGateWay.get("/job", jobParam).then(function(response) {
            if (response.data.status == 200) {
                var jobListResponse = response.data.data;
                $scope.totalRecord = jobListResponse.rows;
                $scope.routeCount = jobListResponse.routeCount;
                $scope.oneOfJobCount = jobListResponse.oneOfJobCount;
                $scope.totalPage = ($scope.totalRecord % $scope.limit) !== 0 ? parseInt($scope.totalRecord / $scope.limit) : parseInt(($scope.totalRecord / $scope.limit)) - 1;
                $scope.jobList = jobListResponse.data;
            } else {
                $scope.jobList = [];
            }
            $scope.isProcessing = false;
        },function(error){
            var analyticsData = {};
                analyticsData.requestData = {};
                analyticsData.userData = $rootScope.userSession;
                analyticsData.actionTime = new Date();
                analyticsData.errorData = error;
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Error - Get Customer Job List', "Error on getCustomerJobList - " + currentDateTime, analyticsDataString, 0, true);
        });
    };
    $scope.goToCustomerJobListPage = function(page) {
        $scope.currentPage = page;
        $scope.getCustomerJobList();
    };
    $scope.filterModel = {
        filterMonth: '90 days'
    }
    $scope.dateRangeModel ={
        graphFromDate: "",
        graphToDate: ""
    }
    $scope.fromDate = "";
    $scope.toDate = "";
    $scope.filterByDate = function(p) {
        if ($scope.fromDate != '' && $scope.toDate != '') {
            var fromDate = new Date($scope.fromDate)
            var toDate = new Date($scope.toDate);
            if (fromDate <= toDate) {
                if ($scope.listingTab['jobHistory']) {
                    $scope.currentPage = 1;
                    $scope.getCustomerJobList();
                } else {
                    $scope.currentPageFb = 1;
                    $scope.getCustomerFeedbackList()
                }
                
            } else {
                //alert("From date should be smaller than to date");
                if (p == 'fromDate') {
                    $scope.fromDate = '';
                } else {
                    $scope.toDate = '';
                }
            }
        } else {
            if ($scope.fromDate == '' && $scope.toDate == '') {
                if ($scope.listingTab['jobHistory']) {
                    $scope.getCustomerJobList();
                } else {
                    $scope.getCustomerFeedbackList()
                }
            }
        }
    };
    $scope.showSensor = function() {
        ngDialog.open({
            template: 'sensor.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function() {}
        });

    };
    

    $scope.clickDate = function(event) {
        angular.element(document.getElementsByClassName('currentDateCalendar')).removeClass('currentDateCalendar');
        angular.element(event.target.parentNode).addClass('currentDateCalendar');
    }
    $scope.installDetail = {};
    $scope.jobSensor = {};
    $scope.isInstall = false;
    $scope.activityModel = {
        "galId": 0,
        "saltId": 0,
        "jobId": "",
        "gallanogeCalculated": null,
        "saltSystem": "",
        "addressId": $scope.addressId
    }


    $scope.checkListArray = [];
    $scope.serviceLevelArray = [];
    $scope.assignedSL = '';

    $scope.getCustomerAddressList = function(customerId,$event="") {
    
        $scope.isProcessing = true;
        if($event){
            $scope.searchKey = $event.target.value.trim().replace(/,/g, "");
            searchKey = $scope.searchKey;
        }
        
        apiGateWay.get("/customer_address", {"customerId":customerId,"searchKey":searchKey}).then(function(response) {
            if (response.data.status == 200) {   
                $scope.addressList = response.data.data.data;
                let billing = $scope.addressList.filter(function(item){
                    return item.isBilling == true;
                })
                if(billing.length > 0){
                    $rootScope.billingAddObj.address = billing[0];
                }
                
            } else {
                $scope.addressList = [];
            }
            $scope.isProcessing = false;
        },function(error){
            $scope.isProcessing = false;
        });
    };
    $scope.deleteAddressConfirm = function(index,addressId){   
        $scope.currentAddressId = addressId;
        $scope.index = index;
        $scope.deletePopup = ngDialog.open({
            template: 'removeAddressConfirm.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function () {
              $scope.currentAddressId = '';      
            }
        });
      }
      
      $scope.deleteAddress = function(){
        $scope.isProcessing = true;   
        apiGateWay.send("/customer/delete_cust", {addressId: $scope.currentAddressId}).then(function(response) {
            if (response.data.status == 200) {
                angular.forEach($scope.addressList, function(element, index){
                    if (element.isPrimary == 1){
                        $state.go("app.customerdetail", {
                            addressId: element.addressId,
                        });
                    }
                })
                $rootScope.changeCustomerStatus($scope.currentAddressId);
                $scope.getCustomerInfo();
                $scope.getCustomerAddressList($scope.customerId);
                $scope.currentAddressId = '';
                $scope.index = '';
            }
            $scope.closeModal();
            $scope.isProcessing = false;
            $scope.index='';
        }, function(error){
            $scope.closeModal();
            $scope.isProcessing = false;
            $scope.error = error;
            setTimeout(function() {
                $scope.error = "";
            }, 2000);
            $scope.index='';
        })
      }


    $scope.showEditAddressForm = function(currentIndex,addressObj) {
        $scope.showTaxInputsData(addressObj.addressId);
        $scope.customerModel = {};
        $scope.customerModel = angular.copy(addressObj);
        $scope.customerModel['addressLine1'] = addressObj.address;
        angular.forEach($scope.isEditAddress, function(element, index){
            $scope.isEditAddress[index] = false;
        })

        $scope.isEditAddress[currentIndex] = true;
    }
    $scope.closeModal= function(){
        ngDialog.closeAll();
    }

    $scope.showTaxInputsData = function(addressId){
        apiGateWay.get("/company_billing_settings", {"addressId":addressId}).then(function(response) {
            if (response.data.status == 200) {
                // $scope.customerModel.taxTitle = response.data.data.custBillingDefault.taxTitle;
            }  

        }, function(error){
            $scope.error = error;
            setTimeout(function() {
                $scope.error = "";
            }, 2000);
          });
    }

    $scope.deleteContactConfirm = function(index,contactId){   
        $scope.currentcontactId = contactId;
        $scope.index = index;
        $scope.deletePopup = ngDialog.open({
            template: 'removeContactConfirm.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function () {
              $scope.currentcontactId = '';    
            }
        });
      }
      
      $scope.deleteContact = function(){
        $scope.isProcessing = true;    
        apiGateWay.send("/customer/delete_cont", {contactId: $scope.currentcontactId}).then(function(response) {
            if (response.data.status == 200) {
                $scope.contactList.splice($scope.index, 1);
                $scope.currentcontactId = '';
                $scope.index = '';
            }
            $scope.closeModal();
            $scope.isProcessing = false;
            $scope.index='';
        }, function(error){
          $scope.closeModal();
          $scope.isProcessing = false;
          $scope.error = error;
          setTimeout(function() {
              $scope.error = "";
          }, 2000);
          $scope.index='';
        })
      }
    $scope.showEditContactForm = function(currentIndex,contactObj) {
        $scope.contactModel = {};
        $scope.contactFormClose = true;
        $scope.contactModel = angular.copy(contactObj);
        $scope.contactModel['contactId'] = contactObj.id;
        angular.forEach($scope.isEditContact, function(element, index){
            $scope.isEditContact[index] = false;
        })

        $scope.isEditContact[currentIndex] = true;
    }

    $scope.getCustomerContactList = function(customerId) {
        $scope.isProcessing = true;
        apiGateWay.get("/customer_contacts", {"customerId":customerId}).then(function(response) {
            if (response.data.status == 200) {
                $scope.contactList = response.data.data;
                let billing = $scope.contactList.filter(function(item){
                    return item.isBilling == true;
                })
                if(billing.length > 0){
                    $rootScope.billingAddObj.contact = billing[0];
                }
                setTimeout(() => {
                    if ($scope.contactList.length > 1) {
                        angular.forEach($scope.contactList, (item) => {
                            if (item.isPrimary) {
                                $scope.customerinfo.contact = item;
                            }
                        })
                    }  
                }, 1000)    
            } else {
                $scope.contactList = [];
            }
            $scope.isProcessing = false;
        },function(error){
            $scope.isProcessing = false;
        });
    };
    $scope.getCustomerShortInfo = function(addressId) {
        apiGateWay.get("/customer_short_details", {"addressId":addressId}).then(function(response) {
            if (response.data.status == 200) {
                customerData = response.data.data.customer;
                contactData = response.data.data.contact;
                $scope.customerinfo.customer = customerData;
                $scope.customerinfo.contact = contactData;
                $scope.displayName = $scope.customerinfo.customer.displayName;
                $scope.firstName = $scope.customerinfo.customer.firstName;
                $scope.lastName = $scope.customerinfo.customer.lastName;
                $rootScope.title = $scope.displayName;
            } 
        },function(error){
        });
    };
    $rootScope.refreshCustomer = function(){        
        $state.reload();
    }
    $scope.getCustomerInfo = function() {
        $scope.isProcessing = true;
        var pdata = {
            addressId: $scope.addressId,
            filterMonth: $scope.filterModel.filterMonth,
        };
        if ($scope.dateRangeModel.graphFromDate != '' && $scope.dateRangeModel.graphToDate != '') {
            pdata.startDate = $filter('date')(new Date($scope.dateRangeModel.graphFromDate), 'yyyy-MM-dd');
            pdata.endDate = $filter('date')(new Date($scope.dateRangeModel.graphToDate), 'yyyy-MM-dd');
        }
      
        apiGateWay.get($rootScope.customerDetailEndpoint, pdata).then(function(response) {
            if (response.data) {
                if (response.data.status == 200) {
                    if(response.data.data.customer.companyId == $rootScope.selectedCompany || $rootScope.userSession.companyId){
                        $scope.customerinfo = response.data.data;
                        $rootScope.customerInfoForPaymentPage = response.data.data;
                        $rootScope.customerAutomatedEmailOn = $scope.customerinfo.customer.isAutomatedEmail;
                        $scope.customerTags = $scope.customerinfo.tags && $scope.customerinfo.tags.length > 0 ? $scope.customerinfo.tags : [];
                        $scope.customerQboImportId = $scope.customerinfo.customer.qboImportId ? $scope.customerinfo.customer.qboImportId : '';
                        $scope.getCustomerDetailsFromQBO();           
                        $rootScope.changeCustomerStatus($scope.customerinfo.customer.addressId); 
                        if($scope.customerinfo.customer.customerId){
                            $scope.isDelete = 0;
                            $rootScope.isRouteActive = true; 
                            if($scope.customerinfo.customer.isActive == null){
                                $rootScope.isActive = 'Lead';
                                $scope.isDelete = 1;
                            }
                            else if($scope.customerinfo.customer.isActive == 3){
                                $rootScope.isActive = 'Active (no route)';
                            }
                            else if($scope.customerinfo.customer.isActive == 0){
                                $rootScope.isActive = 'Inactive';
                            }
                            else if($scope.customerinfo.customer.isActive == 1){
                                $rootScope.isActive = 'Active (routed)';
                            }
                            else{
                                $rootScope.isActive = 'Archived';
                                $rootScope.isRouteActive = false; 
                            }
                            $scope.customerId = $scope.customerinfo.customer.customerId;
                            $rootScope.customerDepartmentId = $scope.customerinfo.customer.departmentId;
                            $rootScope.customerBillingData.customerId = $scope.customerinfo.customer.customerId;
                            $scope.displayName = $scope.customerinfo.customer.displayName;
                            $rootScope.displayName = $scope.customerinfo.customer.displayName;
                            $scope.firstName = $scope.customerinfo.customer.firstName;
                            $scope.lastName = $scope.customerinfo.customer.lastName;
                            $scope.getCustomerAddressList($scope.customerinfo.customer.customerId);
                            $scope.getCustomerContactList($scope.customerinfo.customer.customerId);
                            $rootScope.showCompanyById($scope.customerinfo.customer.companyId);
                        }
                        if($scope.customerinfo.customer.isPrimary!=1){
                            // $state.go('app.locationdetail', {
                            //     addressId:$scope.addressId
                            // });
                            $state.go('app.customerdetail', {
                                addressId:$scope.customerinfo.customer.primeaddressId
                            });
                        }
                        $scope.installDetail = $scope.customerinfo.installDetail;
                        $scope.installDetail.gallonage = $scope.customerinfo.installDetail.gallonage ? $scope.customerinfo.installDetail.gallonage : null;
    
                        $rootScope.checkListArrayParent = response.data.data.checkList
                        $rootScope.serviceLevelArrayParent = response.data.data.serviceLevel;
                        $rootScope.assignedSLParent = response.data.data.assignedSL;
                        $scope.activityModel.gallanogeCalculated = $rootScope.gallanoges ? parseFloat($rootScope.gallanoges) : null;
                        $scope.activityModel.galId = $scope.installDetail.installerTrackingId;
                        $scope.activityModel.saltSystem = $scope.installDetail.saltSystem && $scope.installDetail.saltSystem =='active' ? true : false;
                        $scope.activityModel.saltId = $scope.installDetail.saltId ? $scope.installDetail.saltId : 0;
                        $scope.activityModel.jobId = $scope.installDetail.jobId;
                        
                        $scope.installer = $scope.customerinfo.installer;
                        $scope.jobSensor = $scope.customerinfo.jobSensorData;
                        $scope.isInstall = (Object.keys($scope.installDetail).length > 0)?true:false;
                        $rootScope.subTitle = 'Customer';
                        $rootScope.title = $scope.displayName;
                        $scope.jobType = $scope.customerinfo.customer.jobType && $scope.customerinfo.customer.jobType == 'chemical' ? true : false;
                        $scope.activityModel.jobType = $scope.jobType;
                        $rootScope.activityModelParent = $scope.activityModel;
                        $rootScope.installDetailParent = $scope.installDetail;
                        $rootScope.waterBodyTypeDefault = response.data.data.waterBodyType;
                        $rootScope.waterBodiesParent = response.data.data.waterBodies;
                        $rootScope.getChecklistItemDetail();
                        
                        $rootScope.custAddrDetailsData = response.data.data.custAddrDetailsData[1];
                        $rootScope.existsInvoicePayment = response.data.data.custAddrDetailsData[0].existsInvoicePayment
                        if($scope.isPropertyInformation) { $rootScope.getPropertyItemDetails(); }
                        $rootScope.custAddrSchData = response.data.data.custAddrSchData[0];
                        $rootScope.custAddrSchData.addressRouteDetails = response.data.data.addressRouteDetails;
                        $rootScope.custAddrSchData.endDate = response.data.data.customer.endDate; 
                        if($scope.isServiceSchedule) { $rootScope.getSchedulerDetails(); }
                        $scope.customerinfo.customer.primaryEmail = $scope.primaryEmail = $scope.customerinfo.customer.primaryEmail && $scope.customerinfo.customer.primaryEmail != 'None' ? $scope.customerinfo.customer.primaryEmail : '';
                        $scope.displayName = $scope.customerinfo.customer.displayName;
                        $scope.firstName = $scope.customerinfo.customer.firstName;
                        $scope.lastName = $scope.customerinfo.customer.lastName;
                        let cachePayaStatus = $rootScope.customerBillingData.payaStatus ? $rootScope.customerBillingData.payaStatus : undefined;                        
                        $rootScope.customerBillingData = $scope.customerinfo.customerBillingTabData[0];
                        if (!$scope.customerinfo.customerBillingTabData[0].payaStatus && cachePayaStatus) {
                            $rootScope.customerBillingData.payaStatus = cachePayaStatus;
                        }
                        $rootScope.customerBillingData.customer = $scope.customerinfo.customer;
                        $rootScope.customerBillingData.contact = $scope.customerinfo.contact;
                    }
                    else{
                        // window.location.href = "/app/customer";
                    }                  
                } else {
                    $scope.customerinfo = [];
                }
            }
            $scope.isProcessing = false;
            
        }, function(error) {
            var analyticsData = {};
                analyticsData.requestData = pdata;
                analyticsData.userData = $rootScope.userSession;
                analyticsData.actionTime = new Date();
                analyticsData.errorData = error;
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Error - Get Customer Info', "Error on getCustomerInfo - " + currentDateTime, analyticsDataString, 0, true);
        });
    };

    $rootScope.changeCustomerStatus = function () {
        $scope.isChangingStatus = true;
        if($scope.customerinfo){
            apiGateWay.get("/customer/change_status", {'addressId': $scope.customerinfo.customer.addressId }).then(function (response) {
                if (response.status == 200) {
                    $scope.isDelete = 0;
                    response.data.data.forEach(function(item){
                        if (item.updateStatus == null) {
                            $rootScope.isActive = 'Lead';
                            $scope.isDelete = 1;
                        }
                        else if (item.updateStatus == 3) {
                            $rootScope.isActive = 'Active (no route)';
                        }
                        else if (item.updateStatus == 0) {
                            $rootScope.isActive = 'Inactive';
                        }
                        else if (item.updateStatus == 1) {
                            $rootScope.isActive = 'Active (routed)';
                        }
                        else {
                            $rootScope.isActive = 'Archived';
                        }
                        $scope.isChangingStatus = false;                })
                } else {
                    $scope.isChangingStatusError = response.message;
                }
                $scope.isChangingStatus = false;
            }, function (error) {
                $scope.isChangingStatusError = error;
                $scope.isChangingStatus = false;
            });
        }
    }

     //update selected jobId, and update section on the basis of selected Job ID 
     $rootScope.getJobDetailByWaterBody = function(waterBodyObj) {  
        $scope.subJobId = angular.copy(waterBodyObj.jobId ? waterBodyObj.jobId : '');    
        $scope.waterBodyId = angular.copy(waterBodyObj.id ? waterBodyObj.id : '');  
        $scope.waterBodyObj = waterBodyObj;
        $rootScope.initGraphArea($scope.addressId, $scope.waterBodyId, $scope.subJobId, 'customer');
    }

    $scope.saveCheckListTrigger = function(){
        $scope.clearSaveInterval();
        intervalIns = setTimeout(function(){document.getElementById('checklistSubmit').click();}, 1000)
    }

    var intervalIns = false;
    $scope.saveCheckList_Old = function(){
        $scope.isProcessing = true;
        $scope.successMsg = false;
        $scope.clearSaveInterval();
        apiGateWay.send("/company/check_list", {postData: $scope.checkListArray}).then(function(response) {
            var responseData = response.data;
            var checkListArray = angular.copy($scope.checkListArray);
            if(Object.keys(responseData.data).length > 0){
            angular.forEach(checkListArray, function(element, index){
                if(element && element.randomId && responseData.data[element.randomId]){
                    $scope.checkListArray[index].id = responseData.data[element.randomId]
                }
            })
            }

            $scope.successMsg = "Checklist saved successfully.";
            setTimeout(function(){
            $scope.successMsg = false;
            }, 2000)
            $scope.isProcessing = false;
        }, function(error){
            $scope.isProcessing = false;
        })
    }
    $scope.clearSaveInterval = function(){
        if(intervalIns){clearTimeout(intervalIns);}
    }


    $scope.addNewChecklist = function(){
        var newRowChecklist = {
            "status": 1,
            "days": "",
            "addressId": $scope.addressId,
            "title": "",
            "photo": 0,
            "required": 0,
            "id": 0,
            "isLocal":1,
            "randomId": 'random_'+Math.floor(Math.random() * 9999999)
        }
        $scope.checkListArray.push(newRowChecklist);
        setTimeout(function(){
            document.getElementById('checklist-container').scrollTo(-500, 0);
        }, 500)
    }

    $scope.checklistDeleteConfirm = function(checkListObj, index){
        if(checkListObj && checkListObj.id==0){
          $scope.checkListArray.splice(index, 1);
          return
        }
        $scope.checkListObj = checkListObj;
        $scope.index = index;
        ngDialog.open({
            template: 'removeChelistConfirm.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function () {
              $scope.checkListObj = '';
              $scope.index = '';
            }
        });
    }

    $scope.confirmChecklistAction = function(checkListObj, index){
        $scope.isProcessing = true;
        ngDialog.closeAll()
        apiGateWay.send("/company/delete_checklist", {id: checkListObj.id, addressId: $scope.addressId}).then(function(response) {
            if (response.data.status == 200) {
                $scope.checkListArray.splice(index, 1);
            }
            $scope.isProcessing = false;
        }, function(error){
          $scope.isProcessing = false;
        })
    }
    
    $scope.cleanHistoryDeleteConfirm = function(cleanHistoryObj, index){
        if(cleanHistoryObj && cleanHistoryObj.deletedBy==0){
        //  $scope.checkListArray.splice(index, 1);
          return
        }
        cleanHistoryObj['deletedBy'] = $scope.currentUser.id;
        $scope.cleanHistoryObj = cleanHistoryObj;
        $scope.index = index;
        ngDialog.open({
            template: 'removeCleanHistoryConfirm.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function () {
              $scope.cleanHistoryObj = '';
              $scope.index = '';
            }
        });
    }

    $scope.confirmCleanHistoryAction = function(cleanHistoryObj, index){
        $scope.isProcessing = true;
        // ngDialog.closeAll()
        apiGateWay.send("/delete_last_cleaned_date", cleanHistoryObj).then(function(response) {
            if (response.data.status == 200) {
                // $scope.checkListArray.splice(index, 1);
            }
            $rootScope.getEquipmentDetails();
            $scope.isProcessing = false;
        }, function(error){
          $scope.isProcessing = false;
        })
    }





    $scope.getNumberToArray = function(num) {
        return new Array(num);
    };
    $scope.goToJobPage = function(page, actionButton) {
        if ((actionButton == 'first' || actionButton == 'pre') && page < 0) {
            return false;
        }
        if ((actionButton == 'last' || actionButton == 'next') && page > $scope.totalPage) {
            return false;
        }
        $scope.page = page;
        $scope.getCustomerJobList();
    };
    $scope.goToDetail = function(job,isOneOfJob) {
        if (event.ctrlKey || event.metaKey){
            if (isOneOfJob==1){
                var url = "/app/one-time-job/"+job.addressId+'/'+job.jobId;
            }
            else{
                var url = "/app/customerjobdetail/"+job.addressId+'/'+job.jobId;
            }
            
            window.open(url,'_blank');
        }else{
            if (isOneOfJob==1){
                $state.go("app.onetimejob",{"addressId":job.addressId,"jobId":job.jobId}, {reload: true});
            }
            else{
                $state.go("app.customerjobdetail",{"addressId":job.addressId,"jobId":job.jobId}, {reload: true});
            }
            
        }  
    };

    $scope.orderByJobList = function(column) {
        $scope.column = column;
        $scope.dir = ($scope.dir == 'desc') ? 'asc' : 'desc';
        $scope.getCustomerJobList();
    };
    $scope.setTitle = function(alertType) {
        var selectedTabName = alertType;
        if (alertType == 'WaterLevelLow') {
            selectedTabName = 'Water Level Low';
        } else if (alertType == 'GreenPool') {
            selectedTabName = 'Algae';
        } else if (alertType == 'NoPower') {
            selectedTabName = 'No Power';
        } else if (alertType == 'SystemDown') {
            selectedTabName = 'System Down';
        } else if (alertType == 'NoAccess') {
            selectedTabName = 'No Access';
        } else if (alertType == 'Weather') {
            selectedTabName = 'Weather';
        } else if (alertType == 'RepairNeeded') {
            selectedTabName = 'Repair Needed';
        } else if (alertType == 'BrokenGauge') {
            selectedTabName = 'Broken PSI Gauge';
        } else if (alertType == 'MissingGauge') {
            selectedTabName = 'Missing PSI Gauge';
        }else if (alertType == 'Other') {
            selectedTabName = 'Other Issue';
        }
        return selectedTabName;
    };


   
   
    /*customer form*/
    $scope.addAddressForm = function() {   
        $scope.customerModel = {};
        angular.forEach($scope.isEditAddress, function(element, index){
            $scope.isEditAddress[index] = false;
        })

        $rootScope.isAddAddressPopup = true;
        $scope.addCustomerPopup = ngDialog.open({
            template: 'customerAddressTemplate.html',
            className: 'ngdialog-theme-default v-center',
            scope: $scope,
            preCloseCallback: function() {
                $scope.customerModel = {};
                $scope.buttonDisabled = false;
                $rootScope.IsVisibleCityState = false;
                $rootScope.isAddAddressPopup = false;
                   
            }
        });
    };

    $rootScope.$watch('datafetchedaddress',function(newVal, oldVal){
        if(newVal && $rootScope.isAddAddressPopup){
           $scope.customerModel.city = newVal.locality ? newVal.locality : "";
           $scope.customerModel.state = newVal.administrative_area_level_1 ? newVal.administrative_area_level_1 : "";
           $scope.customerModel.zipcode = newVal.postal_code ? newVal.postal_code : "";
           $scope.customerModel.addressLine1 = newVal.address ? newVal.address : "";
        }
         
      }); 

    $scope.closeCustomerPopup = function(){
        $scope.addCustomerPopup.close();
        $rootScope.isAddAddressPopup = false;
        $rootScope.IsVisibleCityState = false;
        setTimeout(()=> $scope.buttonDisabled = false, 1000); 
    };
    

    $scope.updateTax = function(taxRateDataList){
        $scope.customerModel.taxPercentValue = taxRateDataList.amount;
        $scope.customerModel.taxTitle = taxRateDataList.title;
    }

    $scope.removeTax = function(){
        $scope.customerModel.taxTitle = '';
        $scope.customerModel.taxPercentValue = 0;
    }

    $scope.addEditAddress = function(customerModel) {
        $scope.buttonDisabled = true;
        $rootScope.defaultServiceLevelDataFetched = false;
        $rootScope.getDefaultServiceLevelData();
        $scope.customerModel.addressLine1 = $scope.customerModel.addressLine1.replace(/,/g, '');

        $scope.customerModel.addressLine1; 

        var customerModelNew = angular.copy(customerModel);  
        if(!customerModel.addressId){
            customerModelNew.addressId = 0;
            $scope.customerModel.taxPercentValue = undefined;
            $scope.customerModel.taxTitle = undefined;
        }
        customerModelNew.customerId = $scope.customerId;
        customerModelNew.displayName = $scope.displayName;
        customerModelNew.firstName = $scope.firstName;
        customerModelNew.lastName = $scope.lastName;
        customerModelNew.taxPercentValue = undefined;
        customerModelNew.taxTitle = undefined;
        // $scope.isProcessing = true;      
        apiGateWay.send("/customer_address", customerModelNew).then(function(response) {    
            let taxRateObj = {
                'addressId': customerModelNew.addressId != 0 ? customerModelNew.addressId : response.data.data.newCustomerAddrId,
                'taxPercentValue': $scope.customerModel.taxPercentValue,
                'taxTitle': $scope.customerModel.taxTitle
            }
            if (response.data.status == 200) {
                // $scope.isProcessing = false;
                apiGateWay.send("/customer_level_tax",taxRateObj).then(function(response) { 
                    $scope.getCustomerAddressList($scope.customerId);
                    if(customerModel.addressId){
                        $scope.getCustomerShortInfo($scope.addressId);
                    }
                }); 

                /* if(response.data.data.newCustomerAddrId){
                     $state.go('app.customerdetail', {
                        addressId:response.data.data.newCustomerAddrId
                    }); 
                } */
                let serviceLevelData = {
                    id: $rootScope.defaultServiceLevelData.id,
                    addressId: response.data.data.newCustomerAddrId,
                    waterBodyId: response.data.data.waterbodyId,
                    serviceLevelCheck: 1 
                }
                apiGateWay.send("/assign_servicelevel", serviceLevelData).then(function(response) {});
                $scope.successCustomerForm = response.data.message;
                angular.forEach($scope.isEditAddress, function(element, index){
                    $scope.isEditAddress[index] = false;
                })
                setTimeout(function() {
                    $scope.successCustomerForm = '';
                    $scope.closeCustomerPopup();
                }, 1000)             
            } else {    
                $scope.isProcessing = false;
                $scope.errorCustomerForm = 'Something went wrong';
                setTimeout(function() {
                    $scope.errorCustomerForm = "";
                    $scope.buttonDisabled = false;
                }, 2000);
            }
            $scope.isProcessing = false;
          },function(error) {          
            $scope.isProcessing = false;
            $scope.errorCustomerForm = error;
            setTimeout(function() {
                $scope.errorCustomerForm = "";
                $scope.buttonDisabled = false;
            }, 1000);
        });
    };

    $scope.setPrimaryAddress = function(addressId, type) { 
        $scope.isProcessing = true;      
        apiGateWay.send("/set_primary_address", {"customerId":$scope.customerId,"addressId":addressId, "type": type}).then(function(response) {       
            if (response.data.status == 200) {
                $scope.isProcessing = false;
                $scope.getCustomerAddressList($scope.customerId);
                if(type == 'primary'){
                    $state.go("app.customerdetail", {
                        addressId: addressId
                    });
                }
                $scope.successMsg = response.data.message;
                setTimeout(function() {
                    $scope.successMsg = false;

                }, 2000)             
            } else {
                $scope.isProcessing = false;
                $scope.error = 'Something went wrong';
                setTimeout(function() {
                    $scope.error = "";
                }, 2000);
            }
            $scope.isProcessing = false;
            },function(error) {          
            $scope.isProcessing = false;
            $scope.error = error;
            setTimeout(function() {
                $scope.error = "";
            }, 1000);
        });
    }
    /*customer form*/
    $scope.addContactForm = function() {   
        $scope.contactFormClose = false;
        angular.forEach($scope.isEditContact, function(element, index){
            $scope.isEditContact[index] = false;
        })
        $scope.contactModel = {};
        $scope.addContactPopup = ngDialog.open({
            template: 'customerContactTemplate.html',
            className: 'ngdialog-theme-default v-center',
            scope: $scope,
            preCloseCallback: function() {
                $scope.contactModel = '';
            }
        });
    };
    $scope.closeContactPopup = function(){
        $scope.addContactPopup.close();
    };
    $scope.setPrimaryContact = function(contactId, type) {

        $scope.isProcessing = true;      
        apiGateWay.send("/set_primary_contact", {"customerId":$scope.customerId,"contactId":contactId, "type": type}).then(function(response) {        
            if (response.data.status == 200) {
                $scope.isProcessing = false;
                $scope.getCustomerShortInfo($scope.addressId);
                $scope.getCustomerContactList($scope.customerId);
                $scope.successMsg = response.data.message;
                setTimeout(function() {
                    $scope.successMsg = false;

                }, 2000)             
            } else {
                $scope.isProcessing = false;
                $scope.error = 'Something went wrong';
                setTimeout(function() {
                    $scope.error = "";
                }, 2000);
            }
            $scope.isProcessing = false;
          },function(error) {          
            $scope.isProcessing = false;
            $scope.error = error;
            setTimeout(function() {
                $scope.error = "";
            }, 1000);
        });
    }
    
    $scope.addEditContact = function(contactModel) {
        var contactModelNew = angular.copy(contactModel);     
        if(!contactModel.contactId){
            contactModelNew.contactId = 0;
        }
        contactModelNew.customerId = $scope.customerId;
        $scope.isProcessing = true;      
        apiGateWay.send("/manage_add_contact", contactModelNew).then(function(response) {    
            if (response.data.status == 200) {
                $scope.isProcessing = false;
                if(contactModel.contactId){
                    $scope.getCustomerShortInfo($scope.addressId);
                }

                $scope.getCustomerContactList($scope.customerId);
                /* if(response.data.data.newCustomerAddrId){
                     $state.go('app.customerdetail', {
                        addressId:response.data.data.newCustomerAddrId
                    }); 
                } */
                $scope.successContactForm = response.data.message;
                angular.forEach($scope.isEditContact, function(element, index){
                    $scope.isEditContact[index] = false;
                })
                setTimeout(function() {
                    $scope.successContactForm = '';
                    if($scope.contactFormClose == false){                   
                        $scope.closeContactPopup(); 
                    }

                }, 1000)             
            } else {
                $scope.isProcessing = false;
                $scope.errorContactForm = 'Something went wrong';
                setTimeout(function() {
                    $scope.errorContactForm = "";
                }, 2000);
            }
            $scope.isProcessing = false;
          },function(error) {          
            $scope.isProcessing = false;
            $scope.errorContactForm = error;
            setTimeout(function() {
                $scope.errorContactForm = "";
            }, 1000);
        });
    };
    /*Update Coordinate*/
    $scope.showUpdateCoordinate = function(index){
        angular.forEach($scope.updateCoordinateBox, function(item, i){
            if(i != index){
                $scope.updateCoordinateBox[i] = false;
            }
        })
        if($scope.updateCoordinateBox[index]){
            $scope.updateCoordinateBox[index] = false;
        } else {
            $scope.updateCoordinateBox[index] = true;
        } 
    }
    $scope.updateCoordinate = function(addressId){
        //'/set_coordinates'
        //{"addressId": "59072012"}
        $scope.isCoordinateProcess = true;
        apiGateWay.send("/set_coordinates", {"addressId": addressId,"isEdited": 0, "lat": 0, "long": 0}).then(function(response) {         
            if (response.data.status == 200){
                angular.forEach($scope.addressList, function(item, index){
                    if(addressId == item.addressId){
                        $scope.addressList[index].latitude = response.data.data.latitude;
                        $scope.addressList[index].longitude = response.data.data.longitude;
                    }
                })
            } 
            $scope.isCoordinateProcess = false;
          },function(error) {          
            $scope.isCoordinateProcess = false;           
        });

    }
    $scope.latLongModel = {}
    /*Update Coordinate*/
    $scope.showEditLatLong = function(index){
        $scope.latLongSuccess = false;
        angular.forEach($scope.latLongBox, function(item, i){
            if(i != index){
                $scope.latLongBox[i] = false;
            }
        })
        if(index || index == 0){
            if($scope.latLongBox[index]){
                $scope.latLongBox[index] = false;
            } else {
                $scope.latLongModel.lat =  $scope.addressList[index].latitude;
                $scope.latLongModel.long =  $scope.addressList[index].longitude;
                $scope.latLongBox[index] = true;
            }       
        }
    }

    $scope.editLatLong = function(addressId){
        //'/set_coordinates'
        $scope.latLongSuccess = false;
        if($scope.latLongModel.lat && $scope.latLongModel.long){
           
            apiGateWay.send("/set_coordinates", {"addressId": addressId, "isEdited": 1, "lat": $scope.latLongModel.lat, "long":$scope.latLongModel.long}).then(function(response) {         
                if (response.data.status == 200){
                    angular.forEach($scope.addressList, function(item, index){
                        if(addressId == item.addressId){
                            $scope.addressList[index].latitude = response.data.data.latitude;
                            $scope.addressList[index].longitude = response.data.data.longitude;
                            $scope.showEditLatLong();
                            $scope.latLongSuccess = true;
                            setTimeout(function() {
                                $scope.updateCoordinateBox[index] = false;
                            },2000)
                        }
                    })
                } 
                setTimeout(function() {
                    $scope.latLongSuccess = false;
                    if (!$scope.$$phase) $scope.$apply()
                }, 1500);
            
              },function(error) {                    
            });
        }
        //{"addressId": "59072012"}
        
    }

    // $(document).on( "click", 'body', function(e){         
    //     if (e.target.id != 'fa-map-marker' && e.target.id != 'coordinate-box' && e.target.id != 'fa-refresh' && e.target.id != 'fa-pencil' && e.target.id !='latLongBox' && e.target.id !='latBox' && e.target.id !='longBox') {         
    //         $scope.showUpdateCoordinate();
    //     }        
    // });
    $scope.showListingTab = function(tab){
        angular.forEach(Object.entries($scope.listingTab), function(item){
            $scope.listingTab[item[0]] = false;
        })
        $rootScope.listingTab[tab]=true;
    }

    $scope.jobFilterByType = function(type){
        $scope.jobFilter[type] = !$scope.jobFilter[type];
        $scope.jobFilterFb[type] = !$scope.jobFilterFb[type];
        if ($scope.listingTab['jobHistory']) {
             $scope.currentPage = 1;
            $scope.getCustomerJobList()
        } else {
            $scope.currentPageFb = 1;
            $scope.getCustomerFeedbackList()
        }
    }

    $scope.doSearchJobList = function($event, searchText) {
        if(searchText || $scope.searchText != searchText){
            $event.target.blur();
            $scope.currentPage = 1;
            $scope.searchText = searchText.trim().replace(/,/g, "");        
            $scope.getCustomerJobList();
        }
    }
    $scope.doSearchFeedbackList = function($event, searchTextFb) {
        if(searchTextFb || $scope.searchTextFb != searchTextFb){
            $event.target.blur();
            $scope.currentPageFb = 1;
            $scope.searchTextFb = searchTextFb.trim().replace(/,/g, ""); 
            $scope.feedbackPayload.searchText = $scope.searchTextFb;       
            $scope.getCustomerFeedbackList();
        }
    }
    $scope.filterRange = function(custom) {
        $scope.currentPage = 1;
        $scope.filterRangeSelected = custom;
        if ($scope.rangeFilterData[$scope.filterRangeSelected].type != 'custom'){
            $scope.hideShownDatesText = true;
            $scope.hideShowDatesText = 'Hide future dates';
            $scope.showfuturedata = 1;
            if ($scope.listingTab['jobHistory']) {
                $scope.getCustomerJobList()
            } else {
                $scope.getCustomerFeedbackList()
            }
        }
        else {
            $scope.fromDate = '';
            $scope.toDate = '';
            $scope.hideShownDatesText = false;
            $scope.showfuturedata = 0;
        }
    };

    $scope.taxRate = function() {
        apiGateWay.get("/company_billing_settings").then(function(response) {
            if (response.data.status == 200) {
              $scope.taxRateData = response.data.data.taxData;
              $rootScope.companyId = response.data.data.companyId
              angular.forEach($scope.taxRateData, (element, index) => {
                $scope.taxRateDataList = element.option;
              });
            } else {
              
            }
        },function(error){
          
        })
      }

      $scope.hideShowDates = function() {
        $scope.currentPage = 1;
        if($scope.hideShowDatesText == 'Hide future dates'){
            $scope.hideShowDatesText = 'Show future dates'; 
            $scope.showfuturedata = 0;
            $scope.feedbackPayload.showfuturedata = 0;
        }
        else{
            $scope.hideShowDatesText = 'Hide future dates';
            $scope.showfuturedata = 1;
            $scope.feedbackPayload.showfuturedata = 1;
        }
        if ($scope.listingTab['jobHistory']) {
            $scope.getCustomerJobList();
        } else {
            $scope.getCustomerFeedbackList();
        }
    }
    
    $scope.getCustomerFeedbackList = function() {
        $scope.isProcessing = true;
        $scope.feedbackPayload.page = ($scope.currentPageFb && $scope.currentPageFb > 1) ? $scope.currentPageFb-1 : 0;
        dateType = $scope.rangeFilterData[$scope.filterRangeSelected].type
        if (dateType == 'custom' && $scope.fromDate != '' && $scope.toDate != '') {
            $scope.feedbackPayload.startDate = $filter('date')(new Date($scope.fromDate), 'yyyy-MM-dd');
            $scope.feedbackPayload.endDate = $filter('date')(new Date($scope.toDate), 'yyyy-MM-dd');
        } else {
            dateValue = $scope.rangeFilterData[$scope.filterRangeSelected].value
            if(dateType != 'custom') {
                $scope.feedbackPayload.startDate = $filter('date')(new Date(moment().subtract(dateValue, dateType)), 'yyyy-MM-dd');
                $scope.feedbackPayload.endDate = $filter('date')(new Date(moment()), 'yyyy-MM-dd');
            }
        }
        
        if($scope.jobFilterFb.RoutedJob == false && $scope.jobFilterFb.OneOfJob == true){
            $scope.feedbackPayload.isOneOfJob = 1
        }
        if($scope.jobFilterFb.RoutedJob == true && $scope.jobFilterFb.OneOfJob == false){
            $scope.feedbackPayload.isOneOfJob = 0 
        }
        if($scope.jobFilterFb.RoutedJob == true && $scope.jobFilterFb.OneOfJob == true){
            delete $scope.feedbackPayload.isOneOfJob;
        }
        
        $scope.feedbackPayload.showAllProperties = $scope.showAllPropertiesJob.value;
        
        apiGateWay.get("/customer_tech_feedback", $scope.feedbackPayload).then(function(response) {
            if (response.data.status == 200) {
                var jobListResponse = response.data.data;
                $scope.totalRecordFb = jobListResponse.rows;
                $scope.routeCountFb = jobListResponse.routeCount;
                $scope.oneOfJobCountFb = jobListResponse.oneOfJobCount;
                $scope.totalPageFb = ($scope.totalRecordFb % $scope.limit) !== 0 ? parseInt($scope.totalRecordFb / $scope.limit) : parseInt(($scope.totalRecordFb / $scope.limit));
                $scope.feedbackList = jobListResponse.data;
            } else {
                $scope.feedbackList = [];
            }
            $scope.isProcessing = false;
        },function(error){
            var analyticsData = {};
                analyticsData.requestData = {};
                analyticsData.userData = $rootScope.userSession;
                analyticsData.actionTime = new Date();
                analyticsData.errorData = error;
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Error - Get Customer feedback List', "Error on getCustomerFeedbackList - " + currentDateTime, analyticsDataString, 0, true);
        });
    };
    $scope.orderByFeedbackList = function(column) {
        $scope.feedbackPayload.column = column;
        $scope.feedbackPayload.dir = ($scope.feedbackPayload.dir == 'desc') ? 'asc' : 'desc';
        $scope.getCustomerFeedbackList();
    };
    $scope.getReviewDate = (str) => {
        if (str && str.includes('T')) {      
          let _strArr = str.split('T');
          if (_strArr.length > 0) {
            let _date = _strArr[0];
            let _dateArr = _date.split('-');
            let xDate =  _dateArr[2];
            let xMonth = _dateArr[1];
            let xYear = _dateArr[0].length == 4 ? _dateArr[0].slice(-2) : _dateArr[0];
            let date =  xMonth + '/' + xDate + '/' + xYear;
            return date;    
          } else {
            return str;
          }
        }
        return str;
    }
    $scope.goToCustomerFeedbackPage = function(pageFb) {
        $scope.currentPageFb = pageFb;
        $scope.pageFb = pageFb;
        $scope.getCustomerFeedbackList();
    };
    $scope.downloadFeedbackReport = function() {
        var jobParam = {
            techId: $scope.technicianId
        };
        let reportApiURL = '/tech_feedback_report';
        dateType = $scope.rangeFilterData[$scope.filterRangeSelected].type
        if (dateType == 'custom' && $scope.fromDate != '' && $scope.toDate != '') {
            jobParam.startDate = $filter('date')(new Date($scope.fromDate), 'yyyy-MM-dd');
            jobParam.endDate = $filter('date')(new Date($scope.toDate), 'yyyy-MM-dd');
        } else {
            dateValue = $scope.rangeFilterData[$scope.filterRangeSelected].value
            if(dateType != 'custom') {
                jobParam.startDate = $filter('date')(new Date(moment().subtract(dateValue, dateType)), 'yyyy-MM-dd');
                jobParam.endDate = $filter('date')(new Date(moment()), 'yyyy-MM-dd');
            }
        }
        $scope.showEmailFeedbackPopup(jobParam, reportApiURL);
    };
    $scope.showEmailFeedbackPopup = function(jobParam, reportApiURL){
        $scope.reportPageSentReportEmailModel.email = $scope.companyEmailforReports; 
        $scope.reportPageSelectedReportParams.jobParam = jobParam;  
        $scope.reportPageSelectedReportParams.reportApiURL = reportApiURL;  
        ngDialog.open({
            template: 'sentReportEmailPopupFeedback.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {
                $scope.reportPageSelectedReportParams = {};
                $scope.reportPageSentReportEmailModel.email = $scope.companyEmailforReports;
                $scope.reportPagereportGeneratingProcessStart = false;
                $scope.reportPageIsReportSending = false;
            }
            });
    }
    $scope.reportPageErrorMsg = '';
    $scope.sendReport = function() {
        $scope.reportPageIsReportSending = true;
        var reportURL = $scope.reportPageSelectedReportParams.reportApiURL;
        var sendReportParams = {
            email: $scope.reportPageSentReportEmailModel.email,
            reportType: ''
        }
        if (reportURL === '/tech_feedback_report') {
            sendReportParams.reportType = 'feedbackReport'
        }
        apiGateWay.send('/send_email_reports', sendReportParams).then(function(response) {
            if (response.data.status == 200 && response.data.data.reportId) {
                $scope.reportPagereportGeneratingProcessStart = true;
                var params = $scope.reportPageSelectedReportParams.jobParam;
                params.reportId = response.data.data.reportId;
                $scope.generateReportByReportId(params);
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
        apiGateWay.get($scope.reportPageSelectedReportParams.reportApiURL, params).then(function(response) {
        }, function(error){
        });
    }    
    // Linking    
    $scope.customerQboImportId = '';    
    $scope.linkCustomerPopup = null;
    $scope.linkingConfirmationPopup = null;
    $scope.linkingSucessPopup = null;
    $scope.linkingFromCustomerSearchKey = '';
    $scope.selectedLinkingFromCustomer = {};
    $scope.chooseAnotherCustomerInfo = {};
    $scope.isSelectedLinkingFromCustomer = false;
    $scope.linkingFromCustomerPayload = {
        limit: 5,
        offset: 0,
        searchKey: ''
    };
    $scope.linkingFromCustomerList = [];
    $scope.linkingFromCustomerListRows = 0;
    $scope.loadingMoreLinkingFromCustomerList = false;      
    $scope.linkingFromCustomerIsLoading = false; 
    $scope.linkCustomerErrorMsg = '';
    $scope.linkCustomerSuccessMsg = '';
    $scope.searchLinkingFromCustomer = (d, direct=false) => {
        $scope.selectedLinkingFromCustomer = {};
        $scope.isSelectedLinkingFromCustomer = false;
        $scope.linkingFromCustomerSearchKey = !direct ? d.linkingFromCustomerSearchKey : d;
        $scope.linkingFromCustomerList = [];
        $scope.linkingFromCustomerListRows = 0;
        var intervalGap = 500;
        clearInterval($scope.searchLinkingFromCustomer_APIInteval)
        $scope.searchLinkingFromCustomer_APIInteval = setTimeout(function(){
            $scope.getLinkingFromCustomer();
        }, intervalGap)
    }    
    $scope.getLinkingFromCustomer = () => {
        $scope.linkingFromCustomerPayload.searchKey = '';
        let searchKey = $scope.linkingFromCustomerSearchKey;
        if (searchKey && searchKey.length > 2) {
            $scope.linkingFromCustomerPayload.searchKey = searchKey;
            $scope.linkingFromCustomerIsLoading = true;
            apiGateWay.get("/qbo_search", $scope.linkingFromCustomerPayload).then(function(response) {
                if (response.data.status == 200) {
                    let dataArr = response.data.data.data;
                    if (dataArr && dataArr.length > 0) {
                        dataArr.forEach(function(item){
                            $scope.linkingFromCustomerList.push(item)
                        });
                    }
                    $scope.linkingFromCustomerListRows = response.data.data.totalCount;
                }          
                $scope.loadingMoreLinkingFromCustomerList = false; 
                $scope.linkingFromCustomerIsLoading = false;     
            }, function(error) {            
                $scope.loadingMoreLinkingFromCustomerList = false;   
                $scope.linkingFromCustomerIsLoading = false;
            }); 
        }
    }
    $scope.loadMoreLinkingFromCustomerList = () => {
        $scope.linkingFromCustomerPayload.offset = $scope.linkingFromCustomerPayload.offset + 1;
        $scope.loadingMoreLinkingFromCustomerList = true;
        $scope.getLinkingFromCustomer();
    }
    $scope.selectLinkingFromCustomer = (customer) => {
        $scope.customerInfoFromQBO = customer;
        $scope.isChooseAnotherCustomerOpened = false;
        $scope.customerDeletedFromQbo = false;        
        $scope.isSelectedLinkingFromCustomer = true;
        $scope.selectedLinkingFromCustomer = customer;
    }
    $scope.chooseAnotherLinkingFromCustomer = () => {
        $scope.isChooseAnotherCustomerOpened = true;
        $scope.linkCustomerErrorMsg = '';
        $scope.linkCustomerSuccessMsg = '';
        $scope.linkingFromCustomerList = [];
        $scope.isSelectedLinkingFromCustomer = false;
        $scope.selectedLinkingFromCustomer = {};
        setTimeout(function() {
            let input = document.querySelector('#linkingFromCustomerSearchKey');    
            if(input) input.focus();
        }, 200)  
    }
    $scope.userConfirmedLinking = () => {
        $scope.linkingFromCustomerSearchKey = '';
        let input = document.querySelector('#linkingFromCustomerSearchKey');    
        if(input) input.value = '';
        $scope.linkingFromCustomerList = [];
        $scope.linkingFromCustomerListRows = 0;
        $scope.isCustomerLinkingInProgress = true;
        $scope.linkCustomerErrorMsg = '';
        $scope.linkCustomerSuccessMsg = '';
        $scope.linkingConfirmationPopup.close();
        let payLoad = {
            qboCustomerId: $scope.chooseAnotherCustomerInfo.ImportId,
            qboAddressId: $scope.chooseAnotherCustomerInfo.BillAddrId,
            customerId: $scope.customerinfo.customer.customerId,
            addressId: $scope.customerinfo.customer.primeaddressId,
        };
        apiGateWay.send("/qbo_customer_map", payLoad).then(function(response) {
            if (response.data.status == 200) {
                $scope.customerQboImportId = payLoad.qboCustomerId;
                $scope.linkCustomerSuccessMsg = 'Customer linked successfully.';
                $scope.customerNeverMapped = false;                
                $scope.selectLinkingFromCustomer($scope.chooseAnotherCustomerInfo)   
                setTimeout(function(){
                    $scope.linkCustomerSuccessMsg = '';
                }, 2000)
            }     
            $scope.isCustomerLinkingInProgress = false;      
        }, function(error) {     
            $scope.linkCustomerErrorMsg = error ? error : 'Customer linking failed. Please try again.';       
            $scope.isCustomerLinkingInProgress = false; 
        }); 
    }
    $scope.userCancelledLinking = () => {
        $scope.linkingConfirmationPopup.close();
        $scope.chooseAnotherCustomerInfo = {};
        setTimeout(function() {            
            let input = document.querySelector('#linkingFromCustomerSearchKey');    
            if(input) input.focus();
        }, 200) 
    }
    $scope.openLinkCustomerPopup = () => {
        $scope.linkCustomerPopup = ngDialog.open({
            template: 'linkCustomerPopup.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: false,
            closeByDocument: true,
            scope: $scope,
            preCloseCallback: function () {
                $scope.linkingFromCustomerSearchKey = '';
                $scope.linkingFromCustomerList = [];
                $scope.linkingFromCustomerListRows = 0;
                $scope.loadingMoreLinkingFromCustomerList = false;      
                $scope.linkingFromCustomerIsLoading = false; 
                $scope.linkCustomerErrorMsg = '';
                $scope.linkCustomerSuccessMsg = '';
                $scope.isChooseAnotherCustomerOpened = false;
                $scope.selectLinkingFromCustomer($scope.customerInfoFromQBO);
            }
        });
    }
    $scope.openLinkingConfirmationPopup = (customer) => {
        $scope.chooseAnotherCustomerInfo = customer;
        $scope.linkingConfirmationPopup = ngDialog.open({
            template: 'linkingConfirmationPopup.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {
            }
        });
    }  
    $scope.doneLinkingProcess = () => {
        ngDialog.closeAll();
    }
    $scope.customerDeletedFromQbo = false;
    $scope.isDetailsLoadingFromQbo = false;
    $scope.isChooseAnotherCustomerOpened = false;
    $scope.customerNeverMapped = false;
    $scope.getCustomerDetailsFromQBO = () => {        
        if ($scope.customerQboImportId && $scope.customerQboImportId != '') {
            $scope.isDetailsLoadingFromQbo = true;
            let payload = {
                limit: 5,
                offset: 0,
                searchKey: '',
                searchId: $scope.customerQboImportId
            }
            apiGateWay.get("/qbo_search", payload).then(function(response) {
                if (response.data.status == 200) {
                    if (response.data.data.data && response.data.data.data.length == 1) {                         
                        $scope.selectLinkingFromCustomer(response.data.data.data[0])
                    } else if (response.data.data.data && response.data.data.data.length == 0) {
                        $scope.customerDeletedFromQbo = true;
                    }
                }
                $scope.isDetailsLoadingFromQbo = false;
            }, function(error) {            
                $scope.isDetailsLoadingFromQbo = false                
            }); 
        } else {
            $scope.customerNeverMapped = true;
        }
    }
    // Linking   
    // Customer tags
    $scope.isCustomerTagAddInputOn = false;
    $scope.isCustomerTagProcessing = false;
    $scope.isCustomerTagLoading = false;
    $scope.customerTagFormData = {
        tags: '',
        customerId: 0
    }
    $scope.toggleCustmerTagInput = function(newVal='') {
        $scope.isCustomerTagsDropdownOpen = false;
        $scope.isCustomerTagAddInputOn = !$scope.isCustomerTagAddInputOn;
        $timeout(function(){
            if ($scope.isCustomerTagAddInputOn) {
                let input = document.querySelector('.customer-tags-add-input');
                if (input) {
                    $scope.customerTagFormData.tags = newVal;
                    input.focus()
                }
            }
        }, 100)
    }
    $scope.customerTagEndpoint = '/customer_tags';
    $scope.customerTagMsgInterval = null;
    $scope.modifyCustomerTag = function(type='add', tag='') {
        if ($scope.customerTagMsgInterval) {
            $timeout.cancel($scope.customerTagMsgInterval);
        }
        $scope.customerTagFormData.customerId = $scope.customerId;        
        let payload = angular.copy($scope.customerTagFormData)        
        if (type == 'add') {
            if (payload.tags == '') {
                return
            } 
            const isAlreadyExist = $scope.customerTags.some(item => item.toLowerCase() === payload.tags.toLowerCase());
            if (isAlreadyExist) {
                $scope.customerTagError = 'Tag already exists for this customer'
                $scope.customerTagMsgInterval = $timeout(function(){
                    $scope.customerTagError = '';
                }, 2000)
                return
            }
        }        
        if (type == 'delete') {
            payload.action = 'delete';
            payload.tags = tag;
        }
        $scope.customerTagSuccess = '';
        $scope.customerTagError = '';        
        $scope.isCustomerTagProcessing = true;
        apiGateWay.send($scope.customerTagEndpoint, payload).then(function(response) {            
            if (response.data.status == 200) {
                // $scope.customerTagSuccess = 'Tag ' + (type == 'delete' ? 'deleted' : 'added') + ' successfully';
                $scope.isCustomerTagAddInputOn = false;
                $scope.customerTagFormData.tags = '';                
                $scope.refreshCustomerTags();
                $scope.refreshAllCustomerTags();
            } else {
                $scope.customerTagError = response.data.message ? response.data.message : 'Something went wrong';
            }
            $scope.isCustomerTagProcessing = false;
            $scope.customerTagMsgInterval = $timeout(function(){
                $scope.customerTagSuccess = '';
                $scope.customerTagError = '';
            }, 2000)
        }, function(error) {
            $scope.customerTagError = typeof error === 'string' ? error : 'Something went wrong';
            $scope.isCustomerTagProcessing = false;
            $scope.customerTagMsgInterval = $timeout(function(){                
                $scope.customerTagError = '';
            }, 2000)
        }); 
    }
    $scope.addTagToCustomer = function(tag) {    
        $scope.closeCustomerTagsDropdown();    
        $scope.customerTagFormData.tags = tag;
        $scope.modifyCustomerTag()
    }
    $scope.refreshCustomerTags = function() {
        let payload = {
            customerId: $scope.customerId
        }
        $scope.isCustomerTagLoading = true;
        apiGateWay.get($scope.customerTagEndpoint, payload).then(function(response) {
            if (response.data.status == 200) {
                $scope.customerTags = response.data.data && response.data.data.length > 0 ? response.data.data : []
            }
            $scope.isCustomerTagLoading = false;
        }, function(error){
            $scope.isCustomerTagLoading = false;
        })        
    }
    $scope.allCustomerTags = [];
    $scope.refreshAllCustomerTags = function() {  
        $scope.allCustomerTags = [];      
        $scope.isAllCustomerTagLoading = true;       
        apiGateWay.get('/get_tags_by_company').then(function(response) {
            if (response.data.status == 200) {
                let allTags = [];
                if (response.data.data && response.data.data.tags && response.data.data.tags.length > 0) {
                    let _tags = response.data.data.tags;
                    _tags.forEach(function(tag){
                        let formattedTag = tag.trim();
                        if (!allTags.some(existingTag => existingTag.toLowerCase() === formattedTag.toLowerCase())) {
                            allTags.push(formattedTag);
                        }
                    });
                }
                $scope.allCustomerTags = allTags;
            }
            $scope.isAllCustomerTagLoading = false;
        }, function(error){
            $scope.isAllCustomerTagLoading = false;
        })        
    }
    $scope.refreshAllCustomerTags();
    $scope.isCustomerTagsDropdownOpen = false;
    $scope.tagSearchInputStr = '';
    $scope.openCustomerTagsDropdown = function() {
        $scope.isCustomerTagsDropdownOpen = true;
    }
    $scope.closeCustomerTagsDropdown = function() {
        $scope.isCustomerTagsDropdownOpen = false;
    }
    $scope.searchTextTag = '';
    $scope.filteredTags = function() {
        $scope.searchTextTag = $(document).find('#customerTagSearch').val();
        var filter = $scope.searchTextTag.trim().toUpperCase();
        return $scope.allCustomerTags.filter(function(tag) {
        return tag.toUpperCase().indexOf(filter) !== -1;
        });
    };
    // Customer tags
    $rootScope.customerAutomatedEmailOn = null;
    $rootScope.customerAutomatedEmailOnLoading = false;
    $rootScope.toggleCustomerAutomatedEmails = function() {
        if ($rootScope.customerAutomatedEmailOnLoading) {
            return
        }
        $rootScope.customerAutomatedEmailOnLoading = true;
        let payLoad = {
            customerId: $scope.customerId,
            isAutomatedEmail: $rootScope.customerAutomatedEmailOn ? 0 : 1
        }
        apiGateWay.send('/customer_auto_email', payLoad).then(function(response) {
            if (response.data.status == 200) {
                $rootScope.customerAutomatedEmailOn = response.data.data.isAutoEmail;
                $scope.customerinfo.customer.isAutomatedEmail = $rootScope.customerAutomatedEmailOn;
            }
            $rootScope.customerAutomatedEmailOnLoading = false;
        }, function(error){
            $rootScope.customerAutomatedEmailOnLoading = false;
        })
    }
});