angular.module('POOLAGENCY').controller('locationDetailController', function($scope,$state, deviceDetector, $timeout, $rootScope, $filter, $sce, apiGateWay, service, $stateParams, ngDialog,Analytics, configConstant, auth) {
    $scope.isPropertyInformation = configConstant[configConstant.currEnvironment].isPropertyInformation;
    $scope.isServiceSchedule = configConstant[configConstant.currEnvironment].isServiceSchedule;
    $scope.addressId = $stateParams.addressId;
    $scope.selectDate = '';
    $scope.currentPage = 1;
    $scope.limit = 10;
    $scope.dir = 'desc';
    $scope.column = 'createTime';
    $scope.isProcessing = false;
    $scope.showAllPropertiesJob = {value:0};
    $scope.jobType="complete";
    $scope.emailError = false;
    $scope.jobTypes = [{ key: 'chemical', value: 'Chemical Only'}, {key: 'complete',value: 'Full Service'}];
    $scope.hideShownDatesText = true;
    $scope.hideShowDatesText = 'Hide future dates';

    $rootScope.custAddrDetailsData = {};
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
        isLocation: 1,
        searchText: $scope.searchTextFb,
        showfuturedata: $scope.showfuturedata,
    };
    $rootScope.listingTab = {
        jobHistory:true,
        invoice:false
    }
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
      if(email!=$scope.customerinfo.customer.primaryEmail && isEmailOk){
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

    //get Paya Setting
    $rootScope.getPayaSettings = function(){
        $scope.settingDataAvailable = false;
        apiGateWay.get("/company_paya_details").then(function(response) {
        if (response.data.status == 200) {
            if(response.data.data){  
                $scope.payaData = response.data.data;
                $rootScope.customerBillingData.payaStatus = $scope.payaData.status;
            }
            }
            $scope.isProcessing = false;
        }, function(error){
        $scope.isProcessing = false;
        })
    }  

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

    $rootScope.refreshCustomer = function(){
        $state.reload();
    }
    $scope.getCustomerInfo = function() {
        $scope.isProcessing = true;
        var pdata = {
            addressId: $scope.addressId,
            filterMonth: $scope.filterModel.filterMonth
        };
        if ($scope.dateRangeModel.graphFromDate != '' && $scope.dateRangeModel.graphToDate != '') {
            pdata.startDate = $filter('date')(new Date($scope.dateRangeModel.graphFromDate), 'yyyy-MM-dd');
            pdata.endDate = $filter('date')(new Date($scope.dateRangeModel.graphToDate), 'yyyy-MM-dd');
        }
        
        apiGateWay.get($rootScope.customerDetailEndpoint, pdata).then(function(response) {
            if (response.data) {
                if (response.data.status == 200) {                    
                    $scope.customerinfo = response.data.data;
                    $rootScope.customerInfoForPaymentPage = response.data.data;
                    $rootScope.isRouteActive = true; 
                    if($scope.customerinfo.customer.isActive == 2){
                        $rootScope.isRouteActive = false; 
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
                    $scope.displayName = $scope.customerinfo.customer.displayName=='' ? $scope.customerinfo.customer.firstName+" "+$scope.customerinfo.customer.lastName:$scope.customerinfo.customer.displayName;
                    $scope.installer = $scope.customerinfo.installer;
                    $scope.jobSensor = $scope.customerinfo.jobSensorData;
                    $scope.isInstall = (Object.keys($scope.installDetail).length > 0)?true:false;
                    $rootScope.subTitle = 'Location'
                    $rootScope.title = $scope.customerinfo.customer.displayName;
                    $rootScope.title = '<h4 class="header-sub-title">'+$scope.customerinfo.customer.address+'</h4>';
                    $scope.jobType = $scope.customerinfo.customer.jobType && $scope.customerinfo.customer.jobType == 'chemical' ? true : false;
                    $scope.activityModel.jobType = $scope.jobType;
                    
                    $rootScope.activityModelParent = $scope.activityModel;
                    $rootScope.installDetailParent = $scope.installDetail;
                    $rootScope.waterBodyTypeDefault = response.data.data.waterBodyType;
                    $rootScope.waterBodiesParent = response.data.data.waterBodies;
                    $rootScope.getChecklistItemDetail();

                    $rootScope.custAddrDetailsData = response.data.data.custAddrDetailsData[1];      
                    if($scope.isPropertyInformation) { $rootScope.getPropertyItemDetails(); }
                    $rootScope.custAddrSchData = response.data.data.custAddrSchData[0];
                    $rootScope.custAddrSchData.addressRouteDetails = response.data.data.addressRouteDetails;
                    $rootScope.custAddrSchData.endDate = response.data.data.customer.endDate; 
                    if($scope.isServiceSchedule) { $rootScope.getSchedulerDetails(); }
                    $scope.customerinfo.customer.primaryEmail = $scope.primaryEmail = $scope.customerinfo.customer.primaryEmail && $scope.customerinfo.customer.primaryEmail != 'None' ? $scope.customerinfo.customer.primaryEmail : '';
                    let cachePayaStatus = $rootScope.customerBillingData.payaStatus ? $rootScope.customerBillingData.payaStatus : undefined;
                    $rootScope.customerBillingData = $scope.customerinfo.customerBillingTabData[0];
                    if (!$scope.customerinfo.customerBillingTabData[0].payaStatus && cachePayaStatus) {
                        $rootScope.customerBillingData.payaStatus = cachePayaStatus;
                    }
                    $rootScope.customerBillingData.customer = $scope.customerinfo.customer;
                    $rootScope.customerBillingData.contact = $scope.customerinfo.contact;
                   
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

    //update selected jobId, and update section on the basis of selected Job ID 
    $rootScope.getJobDetailByWaterBody = function(waterBodyObj) {  
        $scope.subJobId = angular.copy(waterBodyObj.jobId ? waterBodyObj.jobId : '');    
        $scope.waterBodyId = angular.copy(waterBodyObj.id ? waterBodyObj.id : '');  
        $scope.waterBodyObj = waterBodyObj;
        $rootScope.initGraphArea($scope.addressId, $scope.waterBodyId, $scope.subJobId, 'location');     
    }
    $scope.saveCheckListTrigger = function(){
        
        $scope.clearSaveInterval();
        intervalIns = setTimeout(function(){document.getElementById('checklistSubmit').click();}, 1000)
    }


    var intervalIns = false;
    $scope.clearSaveInterval = function(){
        if(intervalIns){clearTimeout(intervalIns);}
    }


    $scope.addNewChecklist = function(){
        var newRowChecklist = {
            "status": 1,
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

    $scope.goToDetail = function(job, isOneOfJob) {
        if (event.ctrlKey || event.metaKey){
            if (isOneOfJob==1){
                var url = "/app/one-time-job/"+job.addressId+'/'+job.jobId;
            }
            else{
                var url = "/app/customerjobdetail/"+job.addressId+'/'+job.jobId;
            }
            window.open(url,'_blank');
        } else {
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

    $scope.hideShowDates = function() {
        $scope.currentPage = 1;
        if($scope.hideShowDatesText == 'Hide future dates'){
            $scope.hideShowDatesText = 'Show future dates'; 
            $scope.showfuturedata = 0;
        }
        else{
            $scope.hideShowDatesText = 'Hide future dates';
            $scope.showfuturedata = 1;
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
});
