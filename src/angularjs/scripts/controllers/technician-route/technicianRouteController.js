angular.module('POOLAGENCY').controller('technicianRouteController', function ($scope, $window, $rootScope, $filter, $sce, $state, $stateParams, apiGateWay, service, auth, Analytics, ngDialog, $timeout, $q, configConstant) {
    $scope.loggedInRole = auth.loggedInRole();
    $scope.isProcessing = false;
    $rootScope.isProcessingDateChange = true;
    $scope.containerHeight = 0;   
    $scope.weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    $scope.weekDaysAvailableForMove = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    $scope.daysIndex = 0;
    $scope.addEditRouteModel = { color:'#285fc6'};
    $scope.routeSuccess = '';
    $scope.routeError = '';
    $scope.routeMoveDataExist = [];
    $rootScope.addSelection = false;
    $scope.menuOpen = false;
    $rootScope.techPayPerVisit = 0;
    $rootScope.timePerVisit = '0.0';
    $rootScope.propertyCount = 0;
    $rootScope.isCircle = false;
    $scope.isTempMove = true;
    $scope.toolTipMoveHelp= false;
    $scope.toolTipMoveToggleBtn= false;    
    $scope.showDisableTooltip = false;
    $scope.selectedRouteDateForAddress = new Date();
    $scope.selectedRouteDatePopup = new Date();
    $scope.changeDateByArrowDirection = false;
    $rootScope.routes = [];
    $scope.notRoutedBox = [0];
    $scope.notRoutedAddressList = [];
    $scope.notRoutedJobBox = [0];
    $scope.notRoutedJobList = [];
    $rootScope.nonRoutedJobTempId = [];
    $scope.emptyNotRouted = [];
    $scope.notRoutedLimit = 99000;
    $scope.notRoutedOffset = 0;
    $scope.isOptimize = [];
    $scope.optimizeProcess = [];    
    $scope.routeLimit = 1000;
    $scope.routeOffset = 0;    
    $scope.selectedTechId = '';
    $scope.techSearchKey = '';
    $rootScope.routeSearchKey = '';
    $scope.jobPop = false;
    $scope.isopenMoveAddressPopupOpen = false;
    $rootScope.selectedAddressIdArrayModel = {};
    $rootScope.selectedAddressDetailModel = {};
    $rootScope.selectAddressIdArray = [];
    $rootScope.selectedAllAddressModel = {};
    $scope.selectedJobIdArrayModel = {};
    $scope.selectJobIdArray = [];
    $scope.selectedAllJobModel = {};
    $scope.showAddress = {};
    $scope.showNonRoutedAddress = [];
    $scope.showNonRoutedJob = [];
    $scope.selectedCheckboxRoute = 0;
    $scope.selectedJobCheckboxRoute = 0;
    $scope.isRouteExpand = false;
    $rootScope.isHideAllRoute = false;
    $scope.setFitBound = true;    
    $scope.nearestLocationLimit = 20;
    $scope.nearestLocationLimitModel = 20;
    $scope.addressForNearest = '';
    $scope.isMarkerMove = false;
    $scope.routeSearchBox = {routeSearchText:''};
    $scope.techSearchBox = {techSearchText:''};
    $scope.reInitializeMap = true;
    $scope.resetNotRoutedMarker = true;
    $scope.disablePolygonIcon = true;
    $scope.setBoxStatusPopup = {};
    $rootScope.isPastDate = false;
    $scope.jobCount = 0; 
    $scope.filterCount = 0;
    $scope.saltCount = 0;
    $scope.jobTotalAmt = 0;
    $scope.filterTotalAmt = 0;
    $scope.saltTotalAmt = 0;
    $scope.jobType = ["jobs","filter cleans","salt cell cleans"];
    $scope.selectedJobType = ["jobs","filter cleans","salt cell cleans"];
    $scope.jobStatus = {'jobs': true, 'filter cleans':true, 'salt cell cleans':true} 
    $scope.selectedJobTypeCode = [0,1,2];
    $scope.getRouteTimer = [];
    $scope.activeDayCount = auth.getStorage('activeDayCount') ? auth.getStorage('activeDayCount') : 1;
    $scope.activeDates = [];
    $rootScope.activeDates = $scope.activeDates;
    $rootScope.indexes = {};
    $rootScope.routeDuration = {};
    $rootScope.zeroRoute = {};
    $scope.showRouteStopsClass = true;
    $scope.showOneTimeJobsClass = false;
    $scope.permissions = {};
    if (auth.getSession()) {
        $scope.permissions = auth.getSession();
    }
    var delayFactor = 1;
    var delayFactorFirst = 1;
    var directionCount = 1;
    $scope.unscheduledLoading = {
        nonRoutedAddress: true,
        nonRoutedJob: true
    }
    $scope.setAddressIndex = function(dateIdx, routeIndex, addIndex, address, routeDate){
        if(!address.isOneOfJob && address.days && address.days.length > 0) {
            var daysArr = address.days;
            var dayName = moment(routeDate).format('dddd');
            dayName = dayName.toLowerCase();
            if (daysArr.includes(dayName)) {
                address.currDay = dayName;
            }
        } else {
            address.currDay = ''
        }
        var date = moment(routeDate).format('YYYY-MM-DD');
        var id = address.oneOfJobId && address.oneOfJobId != '' && address.oneOfJobId != 0 ? address.oneOfJobId : (address.addressId +'_'+ date);
        $rootScope.indexes[id] = dateIdx + '_' + routeIndex + '_' + addIndex;
    }
    $scope.reSetAddressIndex = function(dateIdx, routeIndex, addIndex, address, routeDate){
        if(!address.isOneOfJob && address.days && address.days.length > 0) {
            var daysArr = address.days;
            var dayName = moment(routeDate).format('dddd');
            dayName = dayName.toLowerCase();
            if (daysArr.includes(dayName)) {
                address.currDay = dayName;
            }
        } else {
            address.currDay = ''
        }
        var date = moment(routeDate).format('YYYY-MM-DD');
        var id = address.oneOfJobId && address.oneOfJobId != 0 ? address.oneOfJobId : (address.addressId +'_'+ date);
        $rootScope.indexes[id] = dateIdx + '_' + routeIndex + '_' + addIndex;
    }
    $scope.statusProps = [
        { 
            id: 1,
            title: 'Pending',
            titleArr: ['Pending','Not Started'],
            progressBarClass: '',
            progressIconSrc: '',
            IsDoneProgressNoAccess: false
        },        
        { 
            id: 2,
            title: 'No Access',
            titleArr: ['No Access'],
            progressBarClass: 'no-access',
            progressIconSrc: 'no-access-icon.png',
            IsDoneProgressNoAccess: true
        },        
        { 
            id: 3,
            title: 'In Progress',
            titleArr: ['In Progress','IN_PROGRESS'],
            progressBarClass: 'in-progress',
            progressIconSrc: 'job-in-progress-icon.png',
            IsDoneProgressNoAccess: true
        },        
        { 
            id: 4,
            title: 'Completed',
            titleArr: ['Completed','Complete'],
            progressBarClass: 'completed',
            progressIconSrc: 'job-done-icon.png',
            IsDoneProgressNoAccess: true
        },        
        { 
            id: 5,
            title: 'Closed',
            titleArr: ['Closed'],
            progressBarClass: 'closed',
            progressIconSrc: 'check-black.jpg',
            IsDoneProgressNoAccess: true
        }        
    ];
    $scope.getJobStatusClasses = function(status) {
        let data = {
            id: 0,
            progressBarClass: 'process-bar-item',
            progressIconSrc: '',
            IsDoneProgressNoAccess: false
        };
        let selectedStatus = $scope.statusProps.find(statusItem => statusItem.titleArr.includes(status) || statusItem.id == status)
        if (selectedStatus) {            
            data.id = selectedStatus.id;
            data.progressBarClass = selectedStatus.progressBarClass ? data.progressBarClass + ' ' + selectedStatus.progressBarClass : data.progressBarClass;
            data.progressIconSrc = selectedStatus.progressIconSrc ? '/resources/images/' + selectedStatus.progressIconSrc : '';
            data.IsDoneProgressNoAccess = selectedStatus.IsDoneProgressNoAccess;
        }       
        return data;
    }
    $scope.getPropertyByID = function(addressId, oneTimeJobId, isOneTimeJob) {
        const allRoutes = $rootScope.routes.flat();
        let allAddresses = [];
        allRoutes.forEach(item=>allAddresses.push(item.addresses))
        allAddresses = allAddresses.flat();        
        let property = allAddresses.find(item => item.addressId == addressId)
        if (isOneTimeJob) {
            property = allAddresses.find(item => item.addressId == addressId && item.oneOfJobId == oneTimeJobId)  
        }
        return property;
    }
    $rootScope.socket.on("refreshRouteJobStatus", function(data){        
        if (data.eventName == 'refreshPropertyStatus') {            
            const receivedAddressId = data.postData.addressId;           
            const allRoutes = $rootScope.routes.flat();
            let targetRoute = '';
            let targetAddress = '';
            if (allRoutes && allRoutes.length > 0) {
                allRoutes.forEach(function(route){
                    let addresses = route.addresses || [];
                    if (addresses && addresses.length > 0) {
                        addresses.forEach(function(address){
                            if (address.addressId == receivedAddressId) {
                                targetAddress = address
                                targetRoute = route
                            }
                        })
                    }
                })
            }
            if ($rootScope.selectAddressIdArray && $rootScope.selectAddressIdArray.length > 0) {
                const indexForDeleteCheckFromSelctedAddressIdArray = $rootScope.selectAddressIdArray.findIndex(address => address.addressId == targetAddress.addressId);
                if (indexForDeleteCheckFromSelctedAddressIdArray !== -1) {
                    $rootScope.selectAddressIdArray.splice(indexForDeleteCheckFromSelctedAddressIdArray, 1);                        
                }
                if ($rootScope.selectedAddressIdArrayModel.hasOwnProperty(targetAddress.addressId+'_'+targetAddress.id)) {
                    delete $rootScope.selectedAddressIdArrayModel[targetAddress.addressId+'_'+targetAddress.id];
                }
            }         
            if (targetRoute) $rootScope.getAddress(targetRoute, true, true);
            if ($scope.isMovePopupOn) $rootScope.getRouteByDateForPopup()
            return
        }
        let receivedAddressId = data.addressId;
        let receivedDate = data.date;
        let receivedStatus = data.status;        
        let receivedOneTimeJobId = data.oneOfJobId;
        let isOneTimeJob = receivedOneTimeJobId && receivedOneTimeJobId != '' && receivedOneTimeJobId != 0;        
        let activeDates = $scope.activeDates.map(item => moment(item).format('YYYY-MM-DD'))
        if (!activeDates.includes(receivedDate)) return         
        let property = $scope.getPropertyByID(receivedAddressId, receivedOneTimeJobId, isOneTimeJob);        
        let queryPropertySelector = '';
        if(isOneTimeJob){
            queryPropertySelector = receivedOneTimeJobId;
        } else if(receivedAddressId){
            queryPropertySelector = receivedAddressId + '_' + receivedDate;                          
        }        
        let progressBar = $('#pb_' + queryPropertySelector);
        let progressIcon = $('#i_pb_' + queryPropertySelector);   
        if(property){            
            let progress = $scope.getJobStatusClasses(receivedStatus);
            property.IsDoneProgressNoAccess = progress.IsDoneProgressNoAccess;
            if(isOneTimeJob){                
                property.jobDetail.jobStatus = progress.id;
            } else if(receivedAddressId){
                property.jobStatusWeb = progress.title;
            }
            if (progressIcon) progressIcon.attr('src', progress.progressIconSrc);
            if (progressBar) progressBar.attr('class', progress.progressBarClass);
            if (progressBar) progressBar.click();
        }
    });
    $scope.$on("$destroy", function () {
        $rootScope.socket.off("refreshRouteJobStatus", function (data) {
        });
        $rootScope.socket.removeListener("refreshRouteJobStatus");
    });
    $rootScope.filters = {"TECHNICIAN" : [], "JOB_TYPE" : [], "JOB_STATUS" : [], "CUSTOMER_TAG" : []};
    $scope.showFilterBox = false;
    $scope.routeFilterLoading = false;
    $scope.routeFilterCache = {};
    $scope.showFilter = function(toggleFilterBox=true){
        $scope['showAddress'][31] = false;
        $scope.menuOpen = false;
        $scope.routeFilterLoading = true;
        if (toggleFilterBox) {
            if($scope.showFilterBox){
                $scope.showFilterBox = false;
                return;
            }
            $scope.showFilterBox = true;
        }        
        $scope.isProcessing = true;
        var date = angular.copy($scope.selectedRouteDate);      
        const rDate = $scope.activeDate;
        if(rDate){
            var selectedDate = moment(rDate).format('YYYY-MM-DD');
        }else{
            var selectedDate  = moment(date).format('YYYY-MM-DD');
        }
        var postData = {
            "date": selectedDate,
            "dayCount": parseInt($scope.activeDayCount)
        }
        if ($scope.routeFilterCache && Object.keys($scope.routeFilterCache).length > 0) {
            var key = postData.date + '_' + postData.dayCount;
            if ($scope.routeFilterCache.hasOwnProperty(key)) {
                $rootScope.routesFilterList = $scope.routeFilterCache[key];
                $scope.routeFilterLoading = false;
                return
            }
        }
        apiGateWay.send("/route_filter", postData).then(function(response) {  
            $scope.isProcessing = false;   
            if (response.data.status == 200) {   
                $rootScope.routesFilterList = response.data.data;            
                $scope.routeFilterCache[postData.date+'_'+postData.dayCount] = angular.copy($rootScope.routesFilterList);                
            }            
            $scope.routeFilterLoading = false;
        }, function(error) {  
            $scope.isProcessing = false;            
            $scope.routeFilterLoading = false;      
        });
    }    
    // $scope.showFilter(false);
    $scope.filterRouteResult = function(filterType, ID){
        var existingFilter = $rootScope.filters[filterType];
        if(!existingFilter){
            return;
        }
        var idIndex = existingFilter.indexOf(ID);
        if(idIndex == -1){
            $rootScope.filters[filterType].push(ID);            
        }else{
            $rootScope.filters[filterType].splice(idIndex, 1);
        }
        $scope.daySelected($scope.activeDayCount, false); 
        $scope.updateUnschedulePaneFilters(true);
        $scope.updateJobFilterBtnDisabled();
        $scope.getAllRouteFilterTemplates();
    }
    $scope.updateUnschedulePaneFilters = function(refreshData=true) {
        $scope.updateJobFilterBtnDisabled();
        if ($scope.isFilterApplyingToUnscheduleSection) {
            if ($rootScope.filters["JOB_TYPE"] && $rootScope.filters["JOB_TYPE"].length > 0) {
                $scope.jobStatus = {'jobs': false, 'filter cleans':false, 'salt cell cleans':false} 
                $scope.selectedJobType = [];
                if ($rootScope.filters["JOB_TYPE"].includes($scope.getJobTypeIds('oneTimeJob').filter_id)) {
                    $scope.jobStatus['jobs'] = true;
                    $scope.selectedJobType.push('jobs');
                }
                if ($rootScope.filters["JOB_TYPE"].includes($scope.getJobTypeIds('filterClean').filter_id)) {
                    $scope.jobStatus['filter cleans'] = true;
                    $scope.selectedJobType.push('filter cleans');
                }
                if ($rootScope.filters["JOB_TYPE"].includes($scope.getJobTypeIds('saltCellClean').filter_id)) {                    
                    $scope.jobStatus['salt cell cleans'] = true;
                    $scope.selectedJobType.push('salt cell cleans');
                }                               
            } else {
                $scope.jobStatus = {'jobs': true, 'filter cleans':true, 'salt cell cleans':true}
                $scope.selectedJobType = [];
                $scope.selectedJobType.push('jobs');
                $scope.selectedJobType.push('filter cleans');
                $scope.selectedJobType.push('salt cell cleans');
            }       
        } else {
            $scope.jobStatus = {'jobs': true, 'filter cleans':true, 'salt cell cleans':true}
            $scope.selectedJobType = [];
            $scope.selectedJobType.push('jobs');
            $scope.selectedJobType.push('filter cleans');
            $scope.selectedJobType.push('salt cell cleans');
        }    
        $scope.selectedJobTypeCode = [];
        angular.forEach($scope.selectedJobType, function(item){
            if(item=='jobs'){
                $scope.selectedJobTypeCode.push(0);
            }
            if(item=='filter cleans'){
                $scope.selectedJobTypeCode.push(1);
            }
            if(item=='salt cell cleans'){
                $scope.selectedJobTypeCode.push(2);
            }
        });
        $scope.getNotRoutedAddress('', true);
        $scope.getNotRoutedJobs('', true);
    }
    $scope.jobFilterBtnDisabled = {
        'jobs': false,
        'filter cleans': false,
        'salt cell cleans': false
    }
    $scope.updateJobFilterBtnDisabled = function() {        
        if ($scope.isFilterApplyingToUnscheduleSection) {
            $scope.jobFilterBtnDisabled['jobs'] = true;
            $scope.jobFilterBtnDisabled['filter cleans'] = true;
            $scope.jobFilterBtnDisabled['salt cell cleans'] = true;
            if ($rootScope.filters["JOB_TYPE"] && $rootScope.filters["JOB_TYPE"].length > 0) {                
                if ($rootScope.filters["JOB_TYPE"].includes($scope.getJobTypeIds('oneTimeJob').filter_id)) {
                    $scope.jobFilterBtnDisabled['jobs'] = false;
                }
                if ($rootScope.filters["JOB_TYPE"].includes($scope.getJobTypeIds('filterClean').filter_id)) {
                    $scope.jobFilterBtnDisabled['filter cleans'] = false;
                }
                if ($rootScope.filters["JOB_TYPE"].includes($scope.getJobTypeIds('saltCellClean').filter_id)) {                    
                    $scope.jobFilterBtnDisabled['salt cell cleans'] = false;
                }
            } else {
                $scope.jobFilterBtnDisabled['jobs'] = false;
                $scope.jobFilterBtnDisabled['filter cleans'] = false;
                $scope.jobFilterBtnDisabled['salt cell cleans'] = false;
            }
        } else {
            $scope.jobFilterBtnDisabled['jobs'] = false;
            $scope.jobFilterBtnDisabled['filter cleans'] = false;
            $scope.jobFilterBtnDisabled['salt cell cleans'] = false;
        }
    }
    $scope.clearFilter = function(){
        var filters = $rootScope.filters;
        if(filters.TECHNICIAN.length > 0 || filters.JOB_TYPE.length > 0 || filters.JOB_STATUS.length > 0 || filters.CUSTOMER_TAG.length > 0){
                $rootScope.filters = {"TECHNICIAN" : [], "JOB_TYPE" : [], "JOB_STATUS" : [], "CUSTOMER_TAG" : []};
                $scope.daySelected($scope.activeDayCount);
        }
        $scope.selectedCustomerTags = [];
        $scope.updateUnschedulePaneFilters();
        $scope.setSelecteRouteFilterTemplate($scope.noneRouteFilterTemplate);
    }
    $scope.reloadPage = function(){
        $scope.isRouteExpand = false;
        for(let i = 0; i<$scope.activeDates.length; i++) {
            $scope.$broadcast('refreshRouteList', ['', true, true, '', '',i]);  
        }
        $scope.getNotRoutedAddress('', true);
        $scope.getNotRoutedJobs('', true);
        $scope.addressForNearest = '';
        $scope.nearestLocationLimit = 20;
        $scope.nearestLocationLimitModel = 20;
        $scope.postData = '';
    } 
    $scope.$on('$viewContentLoaded', function($evt, data) {    
        $('.datepicker-custom-input').datepicker({
            autoclose: true,
            todayBtn: "linked",
            format: 'DD, MM d, yyyy',
            autoclose: true,
        });    
        $('.datepicker-custom-input').datepicker('update',  auth.getStorage('storedMapDate') ? new Date(moment(auth.getStorage('storedMapDate'))) : new Date(moment().startOf('day')));
    });
    $scope.matchCurrentDate = function(date){
        return moment(date).isBefore(moment());
    }
    $scope.$watch('selectedRouteDate', function (newVal, oldVal) {
        var date = moment().subtract(1, 'days');
        $rootScope.isPastDate = moment(newVal).isBefore(date);  
        $scope.daySelected($scope.activeDayCount, false); 
    }, true);
    $scope.convertStrToDate = (str) => {
        return new Date(str)
    }
    $scope.changeDate = function(direction, selectedRouteDate, changeDateByArrowDirection){
        // $scope.showFilterBox = false;
        var date = angular.copy($scope.selectedRouteDate);
        var container = $('.datepicker-custom-input');   
        if(direction == 'prev'){
            $scope.reInitializeMap = true;
            $scope.resetNotRoutedMarker = true;
            $scope.changeDateByArrowDirection = false;    
            container.datepicker('update', new Date(moment(date).subtract(1, 'days')));
            $scope.selectedRouteDateForAddress = new Date(moment(date).subtract(1, 'days'))
        } else if(direction == 'next'){
            $scope.reInitializeMap = true;
            $scope.resetNotRoutedMarker = true;
            $scope.changeDateByArrowDirection = false;
            container.datepicker('update', new Date(moment(date).add(1, 'days')));
            $scope.selectedRouteDateForAddress = new Date(moment(date).add(1, 'days'))
        } else {
            if(!changeDateByArrowDirection){
                $scope.reInitializeMap = true;
                $scope.resetNotRoutedMarker = true;
                $scope.selectedRouteDateForAddress = new Date(moment(date));
                $scope.reloadPage();
                $scope.checkNotRoutedExpanded();
            }
        }
        $scope.showFilter(false);
    }
    $scope.clickedOnCalender = function(){
        $scope.changeDateByArrowDirection = false;
    }
    $scope.checkNotRoutedExpanded = function(){        
        var currentState = $scope.showAddress[31] ? angular.copy($scope.showAddress[31]) : false;
        $scope.showAddress = {};
        $scope.showAddress[31] = currentState;
    }
    $scope.matchDate = function(type=''){
        return false
    }
    $scope.openMenu = function(){
        $scope.showFilterBox = false;
        $scope.showAddress[31] = false;
        $scope.menuOpen = !$scope.menuOpen;
    }
    $scope.back = function(){
        $window.history.back();
    }
    $scope.updateContainerHeight = function(){
        setTimeout(function(){ 
            $scope.containerHeight = 0;       
            $scope.containerHeight += $window.innerHeight;          
            $scope.containerHeight -= 60;   
            $scope.$apply();
        }, 100)     
    }    
    angular.element($window).bind('resize', function () {
        $scope.updateContainerHeight()
    });
    $scope.getNotRoutedAddress = function(type='', isLoader=true){  
        var intervalGap = 500;
        clearInterval($scope.nonrouted_addresses_APIInteval)
        $scope.nonrouted_addresses_APIInteval = setTimeout(function(){   
            var date = type == 'popup' ? $scope.selectedRouteDatePopup : $scope.selectedRouteDate;
        var postData = {
            "date": moment(date).format('YYYY-MM-DD'),       
            "limit" : $scope.notRoutedLimit,
            "offset":  $scope.notRoutedOffset,
            "searchKey": $rootScope.routeSearchKey,            
        }      
        if ($scope.isFilterApplyingToUnscheduleSection) {
            postData.tags = $rootScope.filters["CUSTOMER_TAG"];                        
            let typeFilter = $rootScope.filters["JOB_TYPE"];
            if (typeFilter && typeFilter.length && !typeFilter.includes(0)) {
                postData.jobType = '';                
            }
        }
      if(isLoader) $scope.isProcessing = true;   
        $scope.unscheduledLoading.nonRoutedAddress = true;  
        apiGateWay.send("/nonrouted_addresses", postData).then(function(response) {  
            $scope.isProcessing = false;   
            if (response.data.status == 200) { 
                if(response.data.data[0] && response.data.data[0].addressId){                   
                    response.data.data = $scope.updateDaysData(response.data.data);
                    $scope.notRoutedAddressList = [];
                    $scope.notRoutedAddressListCount = response.data.data.length - 1;
                    var count = 1;
                    angular.forEach(response.data.data, function(item, index){
                        var data = angular.copy(item)
                        data.sNo = count;
                        data.placeholderNo = count;
                        data.currDay = item.days.length > 0 ? item.days[0] : '';                  
                        $scope.notRoutedAddressList.push(data);
                        if(item.days.length > 1){
                            angular.forEach(item.days, function(day, childIndex){
                                var dataInner = angular.copy(item)
                                if(childIndex > 0){                                
                                    dataInner.sNo = ''; 
                                    dataInner.placeholderNo = count;
                                    dataInner.currDay = day;
                                    $scope.notRoutedAddressList.push(dataInner);       
                                }                               
                            })                            
                        }
                        count++;
                    });
                    $scope.emptyNotRouted.push(response.data.data[0])                      
                    if(!$scope.isPastDate){
                        if (!$scope.emptyNotRouted[0].isHidden) { 
                            setTimeout(function(){
                                $scope.generateNonRoutedMarkers()                            
                            }, 500)
                         }
                    }                    
                    if($scope.setFitBound){
                        $scope.setFitBound = false;    
                    }                    
                } else {
                    $scope.emptyNotRouted.push(response.data.data[0])
                    $scope.notRoutedAddressList = [];
                    $scope.notRoutedAddressListCount = 0;
                    if (!$scope.emptyNotRouted[0].isHidden) { 
                        setTimeout(function(){
                            $scope.generateNonRoutedMarkers()                            
                        }, 500)
                    }
                }               
                $scope.checkAllRoutIsHide();   
                $scope.checkBlankRoute();
                if($scope.resetNotRoutedMarker){
                    $scope.resetNotRoutedMarker = false;
                    $scope.resetMapZoom();                   
                } 
            } else {
               $scope.toastMessage('routeError', response.data.message);    
            } 
            $scope.unscheduledLoading.nonRoutedAddress = false;
        }, function(error) {  
            var msg = 'Error';
            if (typeof error == 'object' && error.data && error.data.message) {
                msg = error.data.message;
            } else {
                msg = error;
            }
            $scope.toastMessage('routeError', msg);
            $scope.isProcessing = false;         
            $scope.unscheduledLoading.nonRoutedAddress = false;  
        });
        }, intervalGap)        
    }
    $scope.getNotRoutedJobs = function(type='', isLoader=true){  
        var intervalGap = 500;
        clearInterval($scope.nonrouted_jobs_APIInteval)
        $scope.nonrouted_jobs_APIInteval = setTimeout(function(){   
            var date = type == 'popup' ? $scope.selectedRouteDatePopup : $scope.selectedRouteDate;
        var postData = {
            "date": moment(date).format('YYYY-MM-DD'),       
            "limit" : $scope.notRoutedLimit,
            "offset":  $scope.notRoutedOffset,
            "searchKey": $rootScope.routeSearchKey,
            "jobType": $scope.selectedJobTypeCode.join(',')
        }
        if ($scope.isFilterApplyingToUnscheduleSection) {
            postData.tags = $rootScope.filters["CUSTOMER_TAG"];            
        }
        if(isLoader) $scope.isProcessing = true;   
        $scope.unscheduledLoading.nonRoutedJob = true;
        apiGateWay.send("/nonrouted_jobs", postData).then(function(response) {  
            $scope.isProcessing = false;   
            if (response.data.status == 200) { 
                $scope.notRoutedJobListCount = response.data.data.length;                
                response.data.data = $scope.updatePrimaryAddressNode(response.data.data)    
                if(response.data.data[0] && response.data.data[0].addressId){
                    $scope.notRoutedJobList = [];
                    $rootScope.nonRoutedJobTempId = [];
                    var count = 1;
                    $scope.jobCount = 0; 
                    $scope.filterCount = 0;
                    $scope.saltCount = 0;
                    $scope.jobTotalAmt = 0;
                    $scope.filterTotalAmt = 0;
                    $scope.saltTotalAmt = 0;
                    angular.forEach(response.data.data, function(item, index){
                        var data = angular.copy(item)
                        data.isOneOfJob = 1;
                        data.sNo = count;
                        data.placeholderNo = count;
                        $scope.notRoutedJobList.push(data);
                        $rootScope.nonRoutedJobTempId.push(data.tempJobId);
                        switch (data.jobType) {
                            case 0:
                                if(data.totalAmount!='' && data.totalAmount>0){
                                    $scope.jobTotalAmt = parseFloat($scope.jobTotalAmt) + parseFloat(data.totalAmount);
                                }  
                                $scope.jobCount++;
                                break;
                            case 1:
                                if(data.totalAmount!='' && data.totalAmount>0){
                                    $scope.filterTotalAmt = parseFloat($scope.filterTotalAmt) + parseFloat(data.totalAmount);
                                }
                                $scope.filterCount++;
                                break;
                            case 2:
                                if(data.totalAmount!='' && data.totalAmount>0){
                                    $scope.saltTotalAmt = parseFloat($scope.saltTotalAmt) + parseFloat(data.totalAmount);
                                }
                                $scope.saltCount++;
                                break;
                          }                        
                        count++;
                    });
                    if(!$scope.isPastDate){
                        if ($scope.emptyNotRouted[0] && !$scope.emptyNotRouted[0].isHidden) { 
                            setTimeout(function(){
                                $scope.generateNonRoutedMarkers()                            
                            }, 500)
                        }                        
                    }   
                    if($scope.setFitBound){
                        $scope.setFitBound = false;    
                    }
                }else{
                    $scope.notRoutedJobList = [];
                    $scope.jobCount = 0; 
                    $scope.filterCount = 0;
                    $scope.saltCount = 0;
                    $scope.jobTotalAmt = 0;
                    $scope.filterTotalAmt = 0;
                    $scope.saltTotalAmt = 0;
                    if(!$scope.isPastDate){
                        if ($scope.emptyNotRouted[0] && !$scope.emptyNotRouted[0].isHidden) { 
                            setTimeout(function(){
                                $scope.generateNonRoutedMarkers()                            
                            }, 500)
                        } 
                    } 
                }
            }
            $scope.unscheduledLoading.nonRoutedJob = false;
        }, function(error){
            $scope.unscheduledLoading.nonRoutedJob = false;
        });
        }, intervalGap)        
    }
    $scope.loadMoreNotRoutedAddresses = function(){
        $scope.notRoutedOffset+1;
        $scope.getNotRoutedAddress('', true);
        $scope.getNotRoutedJobs('', true);
    }
    $scope.resetMapZoom = function(){
        $scope.reInitializeMap = false;
        if($rootScope.isHideAllRoute){
            $scope.googleMapArgs.method.setCenterZoom(); 
        } else {
            $scope.googleMapArgs.method.setFitBounds(); 
        }
    }
    $scope.updateMapOnRouteChange = function (type=''){
        $scope.clearTimeIntervalForGettingRoute();     
        delayFactor = 1;
        delayFactorFirst = 1;
        directionCount = 1;
        if($scope.reInitializeMap){
            $scope.googleMapArgs.method.mapConfig(true);            
            $rootScope.addSelection = false;
            $rootScope.isCircle = false;
            $scope.googleMapArgs.method.drawCircle();
        }
        $scope.disablePolygonIcon = true;
        if (!$scope.emptyNotRouted[0].isHidden) { $scope.generateNonRoutedMarkers('allNonRouted') }
        $rootScope.isProcessingDateChange = true;
        $scope.googleMapArgs.method.removeAllRoutes().then(function(response){
            if($rootScope.routes.length > 0){
                var requests = [];
                var routeHasAddress = false;
                angular.forEach($rootScope.routes, function(routeArr, parentIndex){
                    angular.forEach(routeArr, function(route, index){   
                        if(type == 'setAllShow') { $rootScope.routes[parentIndex][index].isHidden = 0 }             
                        var deferred = $q.defer();
                        requests.push(deferred.promise);      
                        if(route.addresses.length > 0 && !route.isHidden){
                            if(!$scope.getRouteTimer[parentIndex]){
                                $scope.getRouteTimer[parentIndex] = [];
                            }
                            var cacheIndex = "route_"+ route.id + "_" + route.addresses.length;
                            var delay = 0;
                            if(!$rootScope.routeCache[cacheIndex] || ($rootScope.routeCache[cacheIndex] && (!$rootScope.routeCache[cacheIndex].directionsRenderer || $rootScope.routeCache[cacheIndex].directionsRenderer.length == 0))){
                                delay = delayFactorFirst;
                                delayFactorFirst++;
                                if(route.addresses.length > 25){
                                    var extraDelay = Math.floor(route.addresses.length / 25);
                                    if(route.addresses.length % 25){
                                        extraDelay++;
                                    }
                                    delayFactorFirst = delayFactorFirst + extraDelay;
                                }
                            }
                            var delayMS = directionCount < 6 ? 500 : 1000;
                            $scope.getRouteTimer[parentIndex][index] = setTimeout(function(){
                                    $scope.googleMapArgs.method.setSingleRoute(route).then(function(){
                                        $rootScope.zeroRoute[route.id] = false;
                                        deferred.resolve();
                                    }, function(error){
                                        if(error.error.apiStatus == "ZERO_RESULTS"){
                                            $rootScope.zeroRoute[route.id] = true;
                                        }
                                        deferred.reject();     
                                    });
                            }, delay * delayMS);
                            directionCount++;                 
                            routeHasAddress = true;                   
                        } else {
                            deferred.resolve();
                        }                   
                    });   
                });
                $q.all(requests).then(function(response){  
                    $rootScope.isProcessingDateChange = false;   
                    $scope.disablePolygonIcon = false;   
                        $timeout( function(){
                            $scope.resetMapZoom();
                        }, 200) 
                }, function(error) {
                    $rootScope.isProcessingDateChange = false;
                    $scope.disablePolygonIcon = false;
                    $scope.reInitializeMap = false;
                });
            } else{
                $rootScope.isProcessingDateChange = false;
                $scope.disablePolygonIcon = false;
                $scope.reInitializeMap = false;
            }
        }, function(error) {
            $rootScope.isProcessingDateChange = false;
            $scope.disablePolygonIcon = false;
            $scope.reInitializeMap = false;
        });     
    }
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
    $scope.clearTimeIntervalForGettingRoute = function(){
        angular.forEach($scope.getRouteTimer, function(itemArr, pIndex){
            angular.forEach(itemArr, function(item, index){
                if($scope.getRouteTimer[pIndex][index]){
                    clearTimeout($scope.getRouteTimer[pIndex][index]);
                }
            });
        })
        $scope.getRouteTimer = [];
    }
    $scope.showRouteStops = function(){
        $scope.showRouteStopsClass = true;
        $scope.showOneTimeJobsClass = false;
    }
    $scope.showOneTimeJobs = function(){
        $scope.showRouteStopsClass = false;
        $scope.showOneTimeJobsClass = true;
    }
    $scope.checkDaysForRoutePopup = function(route, index, dateIndex='') {
        if ($scope.isEditRoutePopupOpened) {
            return
        }
        $scope.isEditRoutePopupOpened = true;
        var selectedDate = dateIndex ? $scope.activeDates[dateIndex] : $scope.selectedRouteDate;
        var daysIndex = $scope.weekDays.indexOf(moment(selectedDate).format('dddd').toLowerCase());     
        var dayName = angular.copy($scope.weekDays[daysIndex]);
        if(route && route.addresses && route.addresses.length > 0){ 
            var postData = [];
            var selectAddresses = angular.copy(route.addresses);
            angular.forEach(selectAddresses, function(item){
                if(item.days.length > 0){                   
                        postData.push({addressId: item.addressId, dayName:item.days.join(',')});                   
                } else {
                    postData.push({addressId: item.addressId, dayName:''});
                }               
            })    
            $scope.isProcessing = true;
            apiGateWay.send("/check_address_assignment", postData).then(function(response) {
                if (response.data.status == 200) {  
                    if(response.data.data!='1'){    
                        var responseDays = response.data.data.toString().split(',');             
                        if(responseDays.length > 0){
                            $scope.weekDays = responseDays; 
                            if(responseDays.indexOf(dayName) > -1){
                                $scope.daysIndex = responseDays.indexOf(dayName);
                                $scope.daysIndexStart = responseDays.indexOf(dayName);
                            } else {
                                $scope.daysIndex = 0;
                                $scope.daysIndexStart = 0;
                            }                        
                        }                          
                        $scope.helpMessage = response.data.message;
                    }  else {
                        $scope.daysIndex = daysIndex;
                        $scope.daysIndexStart = daysIndex;
                    }    
                    $scope.showAddEditRoutePopup(route, index); 
                } else {
                    $scope.weekDays = []
                    $scope.weekDays.push(dayName)
                    $scope.daysIndex = 0;
                    $scope.daysIndexStart = 0;
                    $scope.showAddEditRoutePopup(route, index);
                }
                $scope.isProcessing = false;
            }, function(error){          
                $scope.weekDays = []
                $scope.weekDays.push(dayName)
                $scope.daysIndex = 0;  
                $scope.daysIndexStart = 0;  
                $scope.showAddEditRoutePopup(route, index);
                $scope.isProcessing = false;
            }) 
        } else {
            $scope.daysIndex = daysIndex;    
            $scope.daysIndexStart = daysIndex;    
            $scope.showAddEditRoutePopup(route, index);        
        }        
    }; 
    $scope.showAddEditRoutePopup = function(route, index){     
        $scope.routeDay = route && route.day ? route.day : '';
        $scope.addEditRouteModel = {
            "title": route && route.title ? route.title : '',
            "color": route && route.color ? route.color :'#285fc6',            
            "routeId":  route && route.id ? route.id : 0,   
            'isAddresses': false  
        }
        if(route && (route.addresses.length > 0 || route.movedAddress.length > 0)){
            $scope.addEditRouteModel.isAddresses = true;
        }
        $scope.routeId = route && route.id ? route.id : 0;
        $scope.routeIndex = index;  
        $scope.addEditRoutePopup = ngDialog.open({
            id  : 10,
            template: 'addEditRoute.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {     
                $scope.addEditRouteModel = {};    
                $timeout(function(){
                $scope.routeIndex = '';    
                $scope.routeId = '';
                $scope.routeDay = '';
                $scope.weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                }, 100)
                $rootScope.setSelectedDateForRouteModification('')
                $scope.isEditRoutePopupOpened = false;
                $scope.canDeleteRoute = false;
            }
        });
    }
    $scope.changeWeekdays  = function(currentIndex, direction){     
        if(direction == 'prev'){
            if(currentIndex == 0){
                $scope.daysIndex = $scope.weekDays.length-1;
            } else {
                $scope.daysIndex = currentIndex-1;
            }            
        }
        if(direction == 'next'){
            if(currentIndex == $scope.weekDays.length-1){
                $scope.daysIndex = 0;
            } else {
                $scope.daysIndex = currentIndex+1;
            }  
        }      
    } 
    $rootScope.selectedDateForRouteModification = '';
    $rootScope.setSelectedDateForRouteModification = (d) => {
        $rootScope.selectedDateForRouteModification = d;
    };
    $scope.saveAddEditRoute = function(model){         
        var postData = {
            "title": model.title,
            "color": model.color,
            "day": $scope.weekDays[$scope.daysIndex],      
            "routeId":  $scope.routeId ? $scope.routeId : 0    
        }
        if($scope.routeId){
            postData.routeId = $scope.routeId;
            postData.date = $rootScope.selectedDateForRouteModification
        }
        let isDayChanged = 0;
        if($scope.weekDays[$scope.daysIndex] != $scope.routeDay && $scope.routeId){   
            isDayChanged = 1;
        }
        postData.isDayChanged = isDayChanged;
        $scope.isProcessing = true;   
        apiGateWay.send("/add_edit_route", postData).then(function(response) {  
            $scope.isProcessing = false;   
            if (response.data.status == 200) {   
                $scope.toastMessage('routeSuccess', response.data.message);
                $scope.addEditRoutePopup.close();        
                if($scope.weekDays[$scope.daysIndex] != $scope.routeDay && $scope.routeId){                    
                    $scope.googleMapArgs.method.removeRoute($scope.routeId)                     
                    $scope.showAddress[$scope.routeId+'_'+$scope.routeIndex] =  false;
                } 
                    var activeDateArr = angular.copy($scope.activeDates);
                    angular.forEach($scope.activeDates, function (aDate, index) {
                        if($scope.routeId){
                            var isRouteIndex = $rootScope.routes[index].filter(function(e){return e.id == $scope.routeId;});
                            if((isRouteIndex && isRouteIndex.length > 0 ) || moment(new Date(aDate)).format('dddd').toLowerCase() == $scope.weekDays[$scope.daysIndex].toLowerCase()){
                                $scope.$broadcast ('refreshRouteList', ['', true, false, '', '',index]);
                            }                            
                        }else if(moment(new Date(aDate)).format('dddd').toLowerCase() == $scope.weekDays[$scope.daysIndex].toLowerCase()){
                            $scope.$broadcast ('refreshRouteList', ['', true, false, '', '',index]);
                        }
                    })
            } else {
                $scope.toastMessage('routeError', response.data.message);    
            }   
        }, function(error) {  
            var msg = 'Error';
            if (typeof error == 'object' && error.data && error.data.message) {
                msg = error.data.message;
            } else {
                msg = error;
            }
            $scope.toastMessage('routeError', msg);
            $scope.isProcessing = false;         
        });
    }
    $scope.canDeleteRoute = false;
    $scope.routeDataCheking = false;
    $scope.checkRouteHasJob = (routeId, index) => {
        $scope.canDeleteRoute = false;
        $scope.routeDataCheking = true;
        apiGateWay.get("/route_has_jobs", {id: routeId}).then(function(response) {
            if (response.data.status == 200) {
                let hasJobAssigned = response.data.data.hasJobAssigned;
                if (!hasJobAssigned) {
                    $scope.canDeleteRoute = true;
                }
                $scope.deleteRouteConfirm(routeId, index)
            }
            $scope.routeDataCheking = false;
        }, function(error){
            $scope.routeDataCheking = false;
        })
    }
    $scope.deleteRouteConfirm = function(routeId){         
        $scope.routeId = routeId;        
        ngDialog.open({            
            id  : 11,
            template: 'deleteRouteConfirm.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {
            }
        });
    }
    $scope.deleteRouteConfirmAction = function(){
        $scope.isProcessing = true;
        var routes =  angular.copy($rootScope.routes);
        var routeIndex = $scope.routeIndex;
        apiGateWay.send("/delete_route", {routeId: $scope.routeId}).then(function(response) {
            if (response.data.status == 200) {    
                if (response.data.data && response.data.data.isErrors) {
                    $scope.toastMessage('routeError', response.data.message);
                    ngDialog.closeAll();
                    $scope.isProcessing = false;
                    return
                }  
                if(routes.length == 1) {
                } else{                   
                }         
                ngDialog.closeAll();
                angular.forEach($scope.activeDates, function (aDate, index) {
                    if($scope.routeId){
                        var isRouteIndex = $rootScope.routes[index].filter(function(e){return e.id == $scope.routeId;});
                        if(isRouteIndex && isRouteIndex.length > 0 ){
                            $scope.$broadcast ('refreshRouteList', ['', true, true, '', '',index]);
                        }                            
                    }
                });
                $scope.getNotRoutedAddress('', true);
                $scope.getNotRoutedJobs('', true);
                $scope.toastMessage('routeSuccess', response.data.message);
            }
            $scope.isProcessing = false;
        }, function(error){
          $scope.isProcessing = false;
        })
    }    
    $scope.movingDayRestrictedPropFromUnscheduledToRouteData = {
        selectedDay: '',
        destDay: ''
    };
    $scope.isDroppedToWrongDate = false;
    $scope.isPastAndSameRouteSameDate = false;
    $scope.isDroppingMovedLabel = false;
    $scope.isDroppingMovedLabelId = 0;
        $scope.routeSortableOptions = {
            accept: function(sourceNodeScope, destNodesScope, destIndex) {
                $scope.destIndex = destIndex;
                var source = sourceNodeScope.$element.attr('data-type');            
                var dest = destNodesScope.$element.attr('data-type');
                var sourceRouteId = sourceNodeScope.$element.attr('data-route-id');
                var destRouteId = destNodesScope.$element.attr('data-route-id');
                var xdestDate = moment($scope.activeDates[destNodesScope.$element.attr('data-date-index')]).format('YYYY-MM-DD')     
                var todaysDateForCompare = moment().subtract(1, 'days');
                var canMoveToThisDate = !moment(xdestDate).isBefore(todaysDateForCompare);          
                var drop_destDate = moment($scope.activeDates[destNodesScope.$element.attr('data-date-index')]).format('YYYY-MM-DD')     
                var drop_sourceDate = moment($scope.activeDates[sourceNodeScope.$element.attr('data-date-index')]).format('YYYY-MM-DD') 
                $scope.isDroppingMovedLabel = false;
                $scope.isDroppingMovedLabelId = 0;
                if (sourceNodeScope.address && sourceNodeScope.address.isTemporary && (sourceNodeScope.address.isTemporary == 1 || sourceNodeScope.address.isTemporary == "1")) {
                    $scope.isDroppingMovedLabel = true;
                    $scope.isDroppingMovedLabelId = sourceNodeScope.$element.attr('data-address-id');
                }               
                if (source != 'route-item' && !canMoveToThisDate) {
                    if (source == 'address-item' && sourceRouteId == destRouteId && drop_destDate == drop_sourceDate) {
                        $scope.isPastAndSameRouteSameDate = true;
                    }
                    $scope.isDroppedToWrongDate = true;
                } else {
                    $scope.isDroppedToWrongDate = false
                } 
                if (source == 'route-item' && (drop_destDate != drop_sourceDate)) {
                    return false;
                }
                if (source == 'route-item' && dest == 'route'){              
                    return true;
                }else if (source == 'address-item' && dest == 'address' ){                                  
                    return true;
                }else if (source == 'job-item' && dest == 'job' ){
                    return true;
                }else{
                    return false;
                }
            },
            dropped: function(event) {
                var body = document.getElementsByTagName('body')[0]
                body.style.overflow = 'auto';
                body.style.height = 'auto';
                var sourceRouteId = '';
                var sourceRoute = '';
                var destRouteId = '';
                var destRoute = '';
                var addressId = '';
                var jobId = '';
                var routeIds = [];
                var params = {};
                var dragType = event.source.nodeScope.$element.attr('data-type');
                var sourceDate = '';
                var destDate = '';
                var addressIds = {};
                angular.forEach($rootScope.routes, function (routeArr, parentIndex) {
                    angular.forEach(routeArr, function (element, routeIndex) {
                        var route = {"routeId":element.id};
                        if(!addressIds[element.id]){
                            addressIds[element.id] = [];
                        }   
                        angular.forEach(element.addresses, function (address, addressIndex) {
                            var date = moment($scope.activeDates[parentIndex]).format('YYYY-MM-DD');
                            var id = address.addressId +'_'+ date;
                            if((address.OneOfJobId && address.OneOfJobId > 0) || (address.jobId && address.jobId > 0) ){
                                addressIds[element.id].push({addressId: address.addressId, jobId: address.OneOfJobId ? address.OneOfJobId : address.jobId});
                                if(!address.OneOfJobId){
                                    $scope.routes[parentIndex][routeIndex].addresses[addressIndex].OneOfJobId = address.jobId;
                                }
                                id = $scope.routes[parentIndex][routeIndex].addresses[addressIndex].OneOfJobId;
                            } else {
                                addressIds[element.id].push({addressId: address.addressId, jobId: 0});
                            }
                            $rootScope.indexes[id] = parentIndex + '_' + routeIndex + '_' + addressIndex;
                        });
                        route['addresses'] = addressIds[element.id];
                        routeIds.push(route); 
                    });
                });
                params = {"sortedRoutes":routeIds,"optimize":0};
                if(dragType == 'route-item'){            
                    var sDateIndex = event.source.nodeScope.$element.attr('data-date-index');
                    var desDateIndex = event.dest.nodesScope.$element.attr('data-date-index');
                    sourceDate = moment($scope.activeDates[sDateIndex]).format('YYYY-MM-DD');
                    destDate = moment($scope.activeDates[desDateIndex]).format('YYYY-MM-DD');
                    if((sourceDate == destDate) || !desDateIndex){
                        $scope.sortRoute('', params);
                        $scope.checkNotRoutedExpanded();
                    }else{
                        return false;
                    }
                } 
                if(dragType == 'address-item'){
                    let fromTechnicianId = event.source.nodeScope.$element.attr('data-tech-id') ? Number(event.source.nodeScope.$element.attr('data-tech-id')) : 0;
                    let toTechnicianId = event.dest.nodesScope.$element.attr('data-tech-id') ? Number(event.dest.nodesScope.$element.attr('data-tech-id')) : 0;
                    params.technicianId = fromTechnicianId;
                    sourceRouteId = event.source.nodeScope.$element.attr('data-route-id');
                    destRouteId = event.dest.nodesScope.$element.attr('data-route-id');
                    addressId = event.source.nodeScope.$element.attr('data-address-id');
                    jobId = event.source.nodeScope.$element.attr('data-job-id');
                    sourceRoute = event.source.nodeScope.$parentNodeScope.$modelValue;
                    destRoute = event.dest.nodesScope.$nodeScope.$modelValue;
                    sourceDate = moment($scope.activeDates[event.source.nodeScope.$element.attr('data-date-index')]).format('YYYY-MM-DD')
                    destDate = moment($scope.activeDates[event.dest.nodesScope.$element.attr('data-date-index')]).format('YYYY-MM-DD')
                    if(sourceRouteId == destRouteId && sourceRouteId != 0){ 
                        var _activeDatesArr = []
                        $scope.activeDates.forEach((value) => {
                            _activeDatesArr.push(moment(value).format('YYYY-MM-DD'))                            
                        })
                        var _index = 0;
                        if (_activeDatesArr.length > 0) {
                            _index = _activeDatesArr.indexOf(sourceDate)
                        }
                        $scope.sortRoute('address', params, sourceRoute, _index, true);    
                    }else if(sourceRouteId == destRouteId && sourceRouteId == 0){ 
                    }else {
                        if(destRouteId == 0){
                            angular.forEach($scope.notRoutedAddressList, function(item, index){
                                if(item.addressId == addressId){
                                    $scope.notRoutedAddressList[index].skipToday = 0;
                                }
                            })
                        }                        
                        let fromTechinician = fromTechnicianId;
                        let toTechinician = toTechnicianId;                        
                        let currDay = event.source.nodeScope.$element.attr('data-curr-day');
                        $scope.moveDragAddress(sourceRoute, sourceRouteId, destRoute, destRouteId, addressId, jobId, sourceDate, destDate, fromTechinician, toTechinician, currDay)
                    }
                }
            },
            beforeDrop: function(event) {
                var destinationRouteId = event.dest.nodesScope.$element.attr('data-route-id');
                var movedlList = document.querySelector('[data-pm-route-id="'+destinationRouteId+'"]');
                $scope.isResettingItem = false;
                if (movedlList && $scope.isDroppingMovedLabel) {                    
                    $scope.isDroppingMovedLabelId = Number($scope.isDroppingMovedLabelId);
                    let _LiArray = Array.from(movedlList.getElementsByTagName("li"));
                    var hasMovedItems = [];
                    if (_LiArray && _LiArray.length > 0) {                        
                        _LiArray.forEach(function(li){
                            hasMovedItems.push(Number(li.getAttribute('data-pm-address-id')))
                        })
                    }
                    $scope.isResettingItem = hasMovedItems.includes($scope.isDroppingMovedLabelId);
                }
                var classListArr = [];
                var isNRJPanel = false;
                if (event.dest.nodesScope.$element.attr('class')) {
                    classListArr = event.dest.nodesScope.$element.attr('class').split(' '); 
                }
                isNRJPanel = classListArr.includes('nrj-panel-wrapper');
                if($scope.isDroppedToWrongDate) {
                    if (!$scope.isPastAndSameRouteSameDate && !isNRJPanel && !$scope.isResettingItem) {                        
                            $scope.closeMoveErrorPopupPastDate();
                            $scope.openMoveErrorPopupPastDate();
                    }
                    $scope.isDroppedToWrongDate = false;
                    $scope.isPastAndSameRouteSameDate = false;                       
                    if ($scope.isResettingItem) {
                    } else {
                        return $q.reject();
                    }    
                }
                var sourceRouteId = '';
                var destRouteId = '';
                var canMove = false;
                var dragType = event.source.nodeScope.$element.attr('data-type');         
                if(dragType == 'address-item'){
                    sourceRouteId = event.source.nodeScope.$element.attr('data-route-id');
                    destRouteId = event.dest.nodesScope.$element.attr('data-route-id');
                    sourceRoute = event.source.nodeScope.$parentNodeScope.$modelValue;
                    sourceAddress = event.source.nodeScope.$modelValue;
                    $scope.isSourceAddressModel = sourceAddress;
                    destRoute = event.dest.nodesScope.$nodeScope.$modelValue;
                    if(destRoute.addresses && destRoute.addresses.length > 0 && sourceAddress.addressId && !sourceAddress.jobId && !sourceAddress.isOneOfJob && sourceRouteId != destRouteId){
                        $scope.routeMoveDataExist = [];
                        for(var i = 0; i < destRoute.addresses.length; i++){
                            if(destRoute.addresses[i].addressId == sourceAddress.addressId && !destRoute.addresses[i].jobId && !destRoute.addresses[i].isOneOfJob){
                                let existProp = destRoute.addresses[i];
                                existProp.customerName = existProp.displayName;
                                $scope.routeMoveDataExist.push(existProp);
                                $scope.showMoveAddressExist();
                                return false;
                            }
                        }
                    }
                    if(sourceAddress.days && !sourceAddress.jobId && !sourceAddress.isOneOfJob){
                        if(sourceAddress.days.length > 0 && sourceRouteId == 0){                    
                            if(sourceAddress.currDay == destRoute.day){
                                canMove = true;
                            }                  
                        } else {
                            canMove = true;
                        }  
                    } else {
                        canMove = true;
                    } 
                    if(sourceRouteId != destRouteId && canMove ){ 
                        $scope.destName =  destRoute.title ? destRoute.title : 'Not Routed';
                    }
                    if(sourceRouteId == destRouteId && (sourceRouteId != 0 && destRouteId != 0)){
                        return true;
                    }
                    if(!canMove && destRouteId != 0){
                        function capitalizeFirstLetter(string='') {
                            if (string == '') {
                                return '';
                            }                        
                            return string.charAt(0).toUpperCase() + string.slice(1);
                          }
                        $scope.movingDayRestrictedPropFromUnscheduledToRouteData.selectedDay = capitalizeFirstLetter(sourceAddress.currDay);
                        $scope.movingDayRestrictedPropFromUnscheduledToRouteData.destDay = capitalizeFirstLetter(destRoute.day);
                        ngDialog.open({    
                            name: 'moveError',
                            template: 'movingDayRestrictedPropFromUnscheduledToRoute_moveError.html',
                            className: 'ngdialog-theme-default v-center',
                            overlay: true,
                            closeByNavigation: true,
                            scope: $scope,
                            preCloseCallback: function () {
                                $scope.movingDayRestrictedPropFromUnscheduledToRouteData.selectedDay = '';
                                $scope.movingDayRestrictedPropFromUnscheduledToRouteData.destDay = '';
                            }
                        })
                        return false;
                    } 
                    if(sourceRouteId == 0 && destRouteId == 0){
                        return false;
                    }
                    if(sourceAddress.skipToday == 1 && sourceRouteId != 0){
                        $scope.toastMessage('routeError', "A route visit you're trying to move is currently set to be skipped. Please undo the skip setting and try again.");
                        return false;
                    }
                }
                return true;
            },
            dragStart : function(event) {
                $scope.setBoxStatusPopup = {}; 
                var body = document.getElementsByTagName('body')[0]
                body.style.overflow = 'hidden';
                body.style.height = '100%';                
            },
        }  
    $rootScope.hideAllBtnStatusChecker = (arr) => {    
        if (arr) {
            var _arr = [];
            arr.forEach(function(){
                _arr.push(false)
            })
            return JSON.stringify(arr) !== JSON.stringify(_arr)
        } 
        return false
    }
    $scope.isSourceAddressModel = {};
    $scope.sortRoute = function(type='', params, route={}, _index=0, refreshRoute=false){  
        if ($scope.isSourceAddressModel) {
            $scope.isSourceAddressModel.isAddressMoved = false;
        }
        var unregister = $rootScope.$watch('routes', function (newVal, oldVal) {
            if (newVal !== oldVal) {
                apiGateWay.send("/set_sequence_route", params).then(function (response) {
                    if (response.data.status == 200) {
                        $scope.isSourceAddressModel.isAddressMoved = true;
                        setTimeout(function () {
                            $scope.isSourceAddressModel.isAddressMoved = false;
                        }, 50);
                        if (type == 'address' || type == 'job') {
                            $scope.googleMapArgs.method.setSingleRoute(route).then(function (data) {
                                $rootScope.zeroRoute[route.id] = false;
                            }, function (error) {
                                if (error.error.apiStatus == "ZERO_RESULTS") {
                                    $rootScope.zeroRoute[route.id] = true;
                                }
                            });
                            $scope.isOptimize = [];
                        }
                        if (refreshRoute) {
                        }
                    } else {
                        $scope.toastMessage('routeError', response.data.message);
                    }
                }, function (error) {
                    $scope.toastMessage('routeError', error);
                });
                $scope.destIndex = null;
                unregister();
            }
            else {
                if ($scope.destIndex !== null) {
                    apiGateWay.send("/set_sequence_route", params).then(function (response) {
                        if (response.data.status == 200) {
                            $scope.isSourceAddressModel.isAddressMoved = true;
                            setTimeout(function () {
                                $scope.isSourceAddressModel.isAddressMoved = false;
                            }, 50);
                            if (type == 'address' || type == 'job') {
                                $scope.googleMapArgs.method.setSingleRoute(route).then(function (data) {
                                    $rootScope.zeroRoute[route.id] = false;
                                }, function (error) {
                                    if (error.error.apiStatus == "ZERO_RESULTS") {
                                        $rootScope.zeroRoute[route.id] = true;
                                    }
                                });
                                $scope.isOptimize = [];
                            }
                            if (refreshRoute) {
                            }
                        } else {
                            $scope.toastMessage('routeError', response.data.message);
                        }
                    }, function (error) {
                        $scope.toastMessage('routeError', error);
                    });
                    $scope.destIndex = null;
                    unregister();
                }
            }
        }, true);
    }
    $scope.sortRouteWithGetRoute = function(params, sourceRouteId, destRouteId){ 
        apiGateWay.send("/set_sequence_route", params).then(function(response) {
            if (response.data.status == 200) {
                angular.forEach($scope.activeDates, function (aDate, index) {
                        var isRouteIndex = $rootScope.routes[index].filter(function(e){return (e.id == sourceRouteId || e.id == destRouteId)});
                        if(isRouteIndex && isRouteIndex.length > 0 ){
                            $scope.$broadcast('refreshRouteList', ['', true, true, '', '',index]);
                        }                            
                });
            } else {
                $scope.toastMessage('routeError', response.data.message);
            }
        }, function(error){
            $scope.toastMessage('routeError', error);
        })
    }

    $scope.optimizeRoute = function(route, routeIndex, parentIndex, selectedDate, routeIdx, activeDate){ 
        var postData = {
            latitude:'',
            longitude:'',
            routeId:route.id, 
            date:selectedDate
        }
        if(route.custStartAddrLatLong){
            var latLong = route.custStartAddrLatLong.split(",");
            postData.latitude = latLong[0];
            postData.longitude = latLong[1]
        } else {
            if(route.addresses[0].latitude && route.addresses[0].longitude){
                postData.latitude = route.addresses[0].latitude;
                postData.longitude = route.addresses[0].longitude;
            } else {  
                $scope.toastMessage('routeError', 'Property address(es) are not valid for creating map routes.');
            }
        }
        apiGateWay.send("/get_routes_nearest_locations", postData).then(function(response) {   
            if (response.data.status == 200) { 
                var tempAddress = []
                angular.forEach(response.data.data, function(element){
                    var address = route.addresses.filter(function(item){ 
                        if (element.oneOfJobId && item.oneOfJobId) {
                            return item.addressId == element.addressId && item.isOneOfJob == element.isOneOfJob && item && item.oneOfJobId == element.oneOfJobId
                        } else {
                            return item.addressId == element.addressId && item.isOneOfJob == element.isOneOfJob && item
                        }
                    })
                    if(address.length > 0){
                        tempAddress.push(address[0])
                    }
                });
                var routeTempData = angular.copy(route);
                routeTempData.addresses = tempAddress;
                var routeIds = [];
                var optimize = true;
                if(!$scope.optimizeProcess[parentIndex]){
                    $scope.optimizeProcess[parentIndex] = [];
                }
                $scope.optimizeProcess[parentIndex][routeIndex] = true;
                var routeData = {"routeId":route.id};
                $scope.googleMapArgs.method.setSingleRoute(routeTempData, optimize).then(function(response){
                    if(response){
                        $rootScope.zeroRoute[routeTempData.id] = false;
                        var addressObj = response;
                        let addressIds = []
                        addressObj.tempAddress.forEach(data => {
                            if(data.isOneOfJob){
                                addressIds.push({addressId: data.addressId, jobId: data.jobDetail.jobId});
                            } else {
                                addressIds.push({addressId: data.addressId, jobId: 0});
                            }
                        })
                        routeData['addresses'] = addressIds;
                        routeIds.push(routeData);
                        var params = {"sortedRoutes":routeIds,"optimize":1};
                        $scope.sortRoute('', params);
                        $scope.isOptimize[parentIndex] = $scope.isOptimize[parentIndex] ? $scope.isOptimize[parentIndex] : [];
                        $scope.isOptimize[parentIndex][routeIndex] = true;
                        $scope.optimizeProcess[parentIndex][routeIndex] = false;
                        $rootScope.routes[parentIndex][routeIndex].addresses = addressObj.tempAddress;
                        addressObj.tempAddress.forEach((address, addIndex) => {
                            $scope.reSetAddressIndex(routeIdx, routeIndex, addIndex, address, activeDate)
                        })
                    }
                }, function(error) {
                    $scope.optimizeProcess[parentIndex][routeIndex] = false;            
                    if(error.error.apiStatus == "ZERO_RESULTS"){
                        $rootScope.zeroRoute[routeTempData.id] = true;
                    } 
                });
            } else {
                $scope.toastMessage('routeError', response.data.message);    
            } 
        }, function(error) {  
            var msg = 'Error';
            if (typeof error == 'object' && error.data && error.data.message) {
                msg = error.data.message;
            } else {
                msg = error;
            }
            $scope.toastMessage('routeError', msg);
        });
    }
    $scope.undoOptimize = function(route, routeIndex, parentIndex, selectedDate, routeIdx, activeDate){
            var params = {"routeId":route.id, date: selectedDate};
            var currentaddresses = $rootScope.routes[parentIndex][routeIndex].addresses;
            var newAddresses = [];
            if(!$scope.optimizeProcess[parentIndex]){
                $scope.optimizeProcess[parentIndex] = [];
            }
            $scope.optimizeProcess[parentIndex][routeIndex] = true;
            apiGateWay.send("/undo_optimize", params).then(function(response) {
                if (response.data.status == 200) {
                    var addressList = response.data.data;
                    angular.forEach(addressList, function (element) {
                        if(!element.isMoved && !element.isAltWeekHide){
                            var index = currentaddresses.findIndex(obj => {
                                if (element.oneOfJobId && obj.oneOfJobId) {
                                    return obj.addressId === element.addressId && obj.isOneOfJob === element.isOneOfJob && obj.oneOfJobId === element.oneOfJobId;
                                } else {
                                    return obj.addressId === element.addressId && obj.isOneOfJob === element.isOneOfJob;
                                }
                            });
                            if (index > -1) {
                                newAddresses.push(currentaddresses[index]);
                            }
                        }
                    });
                    $rootScope.routes[parentIndex][routeIndex].addresses = newAddresses;
                    $scope.googleMapArgs.method.setSingleRoute($rootScope.routes[parentIndex][routeIndex]).then(function(response){
                        $scope.isOptimize[parentIndex] = $scope.isOptimize[parentIndex] ? $scope.isOptimize[parentIndex] : [];
                        $scope.isOptimize[parentIndex][routeIndex] = false;
                        $scope.optimizeProcess[parentIndex][routeIndex] = false; 
                        $rootScope.zeroRoute[$rootScope.routes[parentIndex][routeIndex].id] = false;
                    }, function(error){
                        if(error.error.apiStatus == "ZERO_RESULTS"){
                            $rootScope.zeroRoute[$rootScope.routes[parentIndex][routeIndex].id] = true;
                        }
                    });
                    newAddresses.forEach((address, addIndex) => {
                        $scope.reSetAddressIndex(routeIdx, routeIndex, addIndex, address, activeDate)
                    })
                } else {
                    $scope.optimizeProcess[parentIndex][routeIndex] = false;
                    $scope.toastMessage('routeError', response.data.message);
                }
            }, function(error){
                $scope.optimizeProcess[routeIndex] = false;
                $scope.toastMessage('routeError', error);
            })
    }
    $scope.openAssignTechnicianPopup = function(techId, routeId, routeIndex, parentIndex){
        $scope.techId = techId;
        $scope.routeId = routeId;
        $scope.routeIndex = routeIndex;
        $scope.getTechnicianList();
        $scope.routeParentIndex = parentIndex;
        ngDialog.open({
            id  : 11,
            template: 'assignTechnician.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {
                $scope.techId = '';
                $scope.routeId = '';
                $scope.techSearchKey = '';
                $scope.techSearchBox.techSearchText = '';
            }
        });
    }
    $scope.openStartLocationPopup = function(route, routeIndex, parentIndex){         
        $scope.updateStartLocationModel={};
        $scope.routeId = route.id;
        $scope.routeIndex = routeIndex;
        var address = route.customStartAddress;
        $scope.updateStartLocationModel['parentIndex'] = parentIndex;
        $scope.updateStartLocationModel['routeId'] = $scope.routeId;
        $scope.updateStartLocationModel['address'] = address;
        $scope.updateStartLocationPopup = ngDialog.open({            
            id  : 16,
            template: 'startLocation.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {
                $scope.routeId = '';
                $scope.routeIndex = '';
            }
        });
    }
    $scope.saveStartLocation = function(model){         
        var postData = {
           "routeId":  model.routeId, 
           "address":  model.address
       }
       $scope.isProcessing = true;   
       apiGateWay.send("/update_start_add", postData).then(function(response) {  
           $scope.isProcessing = false;
           $scope.isOptimize[model.parentIndex] = $scope.isOptimize[model.parentIndex] ? $scope.isOptimize[model.parentIndex] : [];
           $scope.isOptimize[model.parentIndex][$scope.routeIndex] = false;    
           if (response.data.status == 200) { 
               $rootScope.routes[model.parentIndex][$scope.routeIndex].customStartAddress = response.data.data.address;
               $rootScope.routes[model.parentIndex][$scope.routeIndex].custStartAddrLatLong = response.data.data.custStartAddrLatLong;
               $scope.googleMapArgs.method.setSingleRoute($rootScope.routes[model.parentIndex][$scope.routeIndex]).then(function(){
                $rootScope.zeroRoute[$rootScope.routes[model.parentIndex][$scope.routeIndex].id] = false;    
            }, function(error){
                if(error.error.apiStatus == "ZERO_RESULTS"){
                    $rootScope.zeroRoute[$rootScope.routes[model.parentIndex][$scope.routeIndex].id] = true;
                }
            });;
               $scope.toastMessage('routeSuccess', response.data.message);
               $scope.updateStartLocationPopup.close();                          
           } else {
               $scope.toastMessage('routeError', response.data.message);    
           }   
       }, function(error) {  
           var msg = 'Error';
           if (typeof error == 'object' && error.data && error.data.message) {
               msg = error.data.message;
           } else {
               msg = error;
           }
           $scope.toastMessage('routeError', msg);
           $scope.isProcessing = false;         
       });
   }
    var tempFilterText = '',
        filterTextTimeout;
    $scope.searchTech = function(searchText){  
        if (filterTextTimeout) $timeout.cancel(filterTextTimeout);
        if(searchText == $scope.techSearchKey || (searchText == $scope.techSearchKey && !searchText)){
            return false;
        }         
        if (filterTextTimeout) $timeout.cancel(filterTextTimeout);
        tempFilterText = searchText;
        filterTextTimeout = $timeout(function() {
            $scope.techSearchKey = tempFilterText;
            $scope.getTechnicianList()
        }, 500); 
    } 
    $scope.searchRoute = function(searchText){ 
        var query = document.getElementById('routeSearchInputPopup').value.toLowerCase();
        $rootScope.routesPopupList = $rootScope.allRoutesPopupList.filter(function(route) {
            var title = (route.title || '').toLowerCase();
            var techName = ((route.techFirstname || '') + ' ' + (route.techLastname || '')).toLowerCase();
            return title.includes(query) || techName.includes(query);
        });
    } 
    $scope.getTechnicianList = function() {        
        $scope.isProcessing = true;
        var paramObj = {status: 'Active', offset: 0, limit: 30, searchKey:$scope.techSearchKey};
        apiGateWay.get("/technicians", paramObj).then(function(response) {
            if (response.data.status == 200) {
                var technicianListResponse = response.data.data;          
                $scope.technicianList = technicianListResponse.data;
            } else {
                $scope.technicianList = [];
            }        
           $scope.isProcessing = false;
        }, function(error){
            $scope.toastMessage('routeError', error);
            $scope.isProcessing = false;
          })
    };   
    $scope.assignTechnician = function(id, index){  
        $scope.techId = id;
        var techIndex = index;
        $scope.isProcessing = true;        
        apiGateWay.send("/tech_assign_route", {routeId: $scope.routeId, technicianId: $scope.techId}).then(function(response) {
            if (response.data.status == 200) {                  
                $rootScope.routes[$scope.routeParentIndex][$scope.routeIndex].techFirstname = $scope.technicianList[techIndex] ? $scope.technicianList[techIndex].firstName : '';
                $rootScope.routes[$scope.routeParentIndex][$scope.routeIndex].techId = $scope.technicianList[techIndex] ? $scope.technicianList[techIndex].id : '';
                $rootScope.routes[$scope.routeParentIndex][$scope.routeIndex].techLastname = $scope.technicianList[techIndex] ? $scope.technicianList[techIndex].lastName : '';
                $rootScope.routes[$scope.routeParentIndex][$scope.routeIndex].technicianId = $scope.technicianList[techIndex] ? $scope.technicianList[techIndex].id : '';
                $rootScope.routes[$scope.routeParentIndex][$scope.routeIndex].userImage = $scope.technicianList[techIndex] ? $scope.technicianList[techIndex].userImage : ''; 
                $scope.removeTechFromRoute($scope.routeParentIndex,$scope.routeIndex, id).then(function(res){                   
                    if($rootScope.routes[$scope.routeParentIndex][res]){                        
                        $rootScope.routes[$scope.routeParentIndex][res].techFirstname = '';
                        $rootScope.routes[$scope.routeParentIndex][res].techId = '';
                        $rootScope.routes[$scope.routeParentIndex][res].techLastname = '';
                        $rootScope.routes[$scope.routeParentIndex][res].technicianId = '';
                        $rootScope.routes[$scope.routeParentIndex][res].userImage = ''; 
                        $scope.googleMapArgs.method.setSingleRoute($rootScope.routes[$scope.routeParentIndex][res]).then(function(){
                        $rootScope.zeroRoute[$rootScope.routes[$scope.routeParentIndex][res].id] = false;                            
                        }, function(error){
                            if(error.error.apiStatus == "ZERO_RESULTS"){
                                $rootScope.zeroRoute[$rootScope.routes[$scope.routeParentIndex][res].id] = true;
                            }
                        });
                    }                     
                })
                $scope.googleMapArgs.method.setSingleRoute($rootScope.routes[$scope.routeParentIndex][$scope.routeIndex]).then(function(){                    
                    $rootScope.zeroRoute[$rootScope.routes[$scope.routeParentIndex][$scope.routeIndex].id] = false;                    
                }, function(error){
                    if(error.error.apiStatus == "ZERO_RESULTS"){
                        $rootScope.zeroRoute[$rootScope.routes[$scope.routeParentIndex][$scope.routeIndex].id] = true;
                    }
                });                
                ngDialog.closeAll();               
                $scope.toastMessage('routeSuccess', response.data.message);
            } else {
                $scope.toastMessage('routeError', response.data.message);
            }
            $scope.isProcessing = false;
        }, function(error){
          $scope.toastMessage('routeError', error);
          $scope.isProcessing = false;
        })
    }
    $scope.removeTechFromRoute = function(parentIndex,routeIndex, id){
        var defer = $q.defer();  
        angular.forEach($rootScope.routes[parentIndex], function (item, index) {
            if (item.techId === id && routeIndex != index ) {
                defer.resolve(index);
            }
        });
        return defer.promise;
    }   
    $rootScope.$watch('selectedAddressIdArrayModel', function (newVal, oldVal) {
        $rootScope.selectAddressIdArray = [];
        Object.keys(newVal).forEach(function(key) {
            if(newVal[key]){
                var addParts = key.toString().split('_');
                var selVal = addParts[0].toString().split('-');
                var jobId = selVal[1]? selVal[1] : '';
                let tempObject = {"addressId":selVal[0],"jobId":jobId};
                $rootScope.selectAddressIdArray.push(tempObject);
            }           
        });
        $rootScope.updateCheckBoxStats();
    }, true);
    $rootScope.isSelectedItemsHasOneTimeJob = false;
    $rootScope.isSelectedItemsHasTemporaryMovedJob = false;
    $rootScope.$watch('selectedAddressDetailModel', function (newVal, oldVal) {
        $rootScope.isSelectedItemsHasOneTimeJob = false;
        $rootScope.isSelectedItemsHasTemporaryMovedJob = false;
        $rootScope.selectedAddressDetail = [];
        Object.keys(newVal).forEach(function(key) {
            if(newVal[key]){
                $rootScope.selectedAddressDetail.push(newVal[key]);
            }
        });
        var _temp = $rootScope.selectedAddressDetail.filter(data => data.isOneOfJob == 1 && data.selected);
        $rootScope.isSelectedItemsHasOneTimeJob = _temp.length > 0;        
        var _temp2 = $rootScope.selectedAddressDetail.filter(data => data.isTemporary == 1 && data.selected);
        $rootScope.isSelectedItemsHasTemporaryMovedJob =  _temp2.length > 0;
    }, true);
    $scope.canVisibleActiveTechnician = (canMove) => {        
        if ($scope.selectedDateForMove == $rootScope.requestedDateStr) {
            return true
        } else if (!$rootScope.isSelectedItemsHasOneTimeJob && !$rootScope.isSelectedItemsHasTemporaryMovedJob && canMove == 0) {
            return true
        } else {
            return false
        }
    }
    $scope.$watch('selectedJobIdArrayModel', function (newVal, oldVal) {
        $scope.selectJobIdArray = [];
        Object.keys(newVal).forEach(function(key) {
            if(newVal[key]){
                var selVal = key.toString().split('-');
                var jobId = selVal[1]? selVal[1] : '';
                let tempObject = {"addressId":selVal[0],"jobId":jobId};
                $scope.selectJobIdArray.push(tempObject)
            }           
        });
    }, true);
    $scope.expandCollapsed = function(obj, $index){ 
        $scope.showFilterBox = false;   
        $scope.menuOpen = false;
        if($scope[obj] && $scope[obj][$index]){
            $scope[obj][$index] = false 
        } else {
            $scope[obj][$index] = true;            
        }
    }
    $scope.collapsedAll = function(){
        angular.forEach($scope['showAddress'],function(item, index){
            $scope.showAddress[index] = false;
            $scope['showAddress'][index] = false;
        })        
    }        
    $scope.$watch('showAddress', function (newVal, oldVal) {      
        $scope.isRouteExpand = false;
        Object.keys(newVal).forEach(function(key) {
            if(newVal[key] == true){
                $scope.isRouteExpand = true;
            }
        });
    }, true);
    $scope.checkRouteExpanded = function(parentIndex){
        angular.forEach($scope['showAddress'],function(item, index){
            if( $scope['showAddress'][index] == true){
                $scope.isRouteExpand = true;
            }           
        })
    }
    $scope.checkBlankRoute = function(parentIndex){    
        angular.forEach($rootScope.routes[parentIndex],function(item, index){            
            if( item.addresses.length == 0){
                $scope['showAddress'][item.id+'_'+index] = false;
            }           
        })
        if($scope.notRoutedAddressList.length == 0){
            $scope['showAddress'][31] = false;
        }
        $scope.checkRouteExpanded(parentIndex);
    }
    $rootScope.openMoveAddressPopupFromMarker = function(addressId, index, routeId){    
        $rootScope.selectedAllAddressModel = {};
        $rootScope.selectedAddressIdArrayModel = {}; 
        $rootScope.selectedAddressDetailModel = {}; 
        $rootScope.selectAddressIdArray = [];
        $rootScope.selectAddressIdArray.push({"addressId":addressId,"jobId":""});
       $scope.jobPop = $rootScope.selectAddressIdArray;
        $scope.openMoveAddressPopup(routeId, 'marker',false,$rootScope.selectAddressIdArray);
    }   
    $rootScope.openMoveJobPopupFromMarker = function(addressId, jobId, routeId){    
        $scope.selectedAllJobModel = {};
        $scope.selectedJobIdArrayModel = {}; 
        $scope.selectJobIdArray = [];
        $scope.selectJobIdArray.push({"addressId":addressId,"jobId":jobId});
        $scope.jobPop = $scope.selectJobIdArray;
        $scope.openMoveAddressPopup(routeId, 'marker',true,$scope.selectJobIdArray);
    }   
    $scope.checkDateSelectedJobs = [];
    $scope.checkOpenMoveAddressPopupInterval;
    $scope.checkOpenMoveAddressPopup = function(routeId, type='', routeIndex, isJob, selectedDate, isMovingFromScheduledSection=false) {
        clearInterval($scope.checkOpenMoveAddressPopupInterval);
        ngDialog.closeAll();
        $scope.checkOpenMoveAddressPopupInterval = setTimeout(function(){
            var selectedJobs = [];
            $scope.checkDateSelectedJobs = [];            
            if(isJob && isJob.length>0) {
                isJob.forEach(function(job){
                    var selected = $scope.notRoutedAddressList.find(x => x.addressId == job.addressId)
                    selected.selected = true;
                    selectedJobs.push(selected)
                    var selected2 = $scope.notRoutedAddressList.filter(function(v, i) {                        
                        return (v.addressId == job.addressId && v.currDay == job.currDay);
                    })                    
                    $scope.checkDateSelectedJobs.push(selected2[0])                    
                })
            } else if (isMovingFromScheduledSection) {
                var _jobs = $rootScope.selectedAddressDetail;
                _jobs.forEach(function(job){                    
                    selectedJobs.push(job)
                    var selected2 = _jobs.filter(function(v, i) {                        
                        return (v.addressId == job.addressId && v.currDay == job.currDay);
                    })                    
                    $scope.checkDateSelectedJobs.push(selected2[0])                    
                })
            }
            $scope.isCurrDayExist = false;
            $scope.isSelectedJobHasSkippedJob = false;
            if(selectedJobs.length>0) {
                selectedJobs.forEach(function(sjob){
                    if (sjob.currDay != '' && sjob.selected) {
                        $scope.isCurrDayExist = true;
                    }
                    if (sjob.skipToday && sjob.selected && sjob.skipToday == 1) {
                        $scope.isSelectedJobHasSkippedJob = true
                    }
                })
            }
            if($scope.isSelectedJobHasSkippedJob){
                $scope.routeError = '';
                $scope.toastMessage('routeError', "A route visit you're trying to move is currently set to be skipped. Please undo the skip setting and try again.", 5000);
                return
            }
            $scope.openMoveAddressPopup(routeId, type, routeIndex, isJob, selectedDate)               
        }, 0)        
    }
    $scope.movingFromUnscheduledOneTimeJob = false;
    $scope.nowMovingFromUnscheduledOneTimeJob = () => {
        $scope.movingFromUnscheduledOneTimeJob = true;
    }
    $scope.postDataforCheckAddressAssignment = {};
    $scope.openMoveAddressPopup = function(routeId, type='', routeIndex, isJob, selectedDate){         
        if ($scope.isopenMoveAddressPopupOpen) {
            return
        }     
        selectedDate = $scope.settedFromDateMarker?$scope.settedFromDateMarker:selectedDate;   
        $scope.isopenMoveAddressPopupOpen = true;
        $scope.selectedDateForMove = selectedDate;
        let isSkipped = false;
        $scope.jobPop = isJob;
        $scope.disablePermanentMove = false; 
        $scope.showDisableTooltip=false;
        var selectedAddressObjArray = [];  
        $scope.routeId = routeId;
        $scope.moveType = type;
        $scope.isMarkerMove = false;        
        var postData = {}     
        var selectAddressId =  [];
        if(isJob){
            angular.forEach(isJob, function(item){
                var idArray = item.addressId.toString().split("_");             
                selectAddressId.push(idArray[0]);
            });
        }else{
            angular.forEach($rootScope.selectAddressIdArray, function(item){
                var idArray = item.addressId.toString().split("_");             
                selectAddressId.push(idArray[0]);
            });
        }
        if(type == 'notRouted'){            
            angular.forEach(selectAddressId, function(item){
                var idArray = item.toString().split("_");             
                selectedAddressObjArray.push({
                    addressId: idArray[0], 
                    dayName: idArray[1] ? idArray[1] : ''
                });
            })
        } else if(type == 'marker' && routeId == 0){   
            $scope.moveType = 'notRouted'; 
            $scope.isMarkerMove = true;
            var temAddressId = '';
            angular.forEach($scope.notRoutedAddressList, function(item){  
                if(selectAddressId.indexOf(item.addressId.toString()) > -1 && temAddressId != item.addressId ){
                    temAddressId = item.addressId;                    
                    if(item.days.length > 0){                        
                        selectedAddressObjArray.push({addressId: item.addressId, dayName: item.days.join(',')});
                    } else {                    
                        selectedAddressObjArray.push({addressId: item.addressId, dayName: ''});
                    }                   
                }
            })   
        } else {
            if(type == 'marker'){
                $scope.isMarkerMove = true;
                angular.forEach($rootScope.routes, function(routeArr){
                    angular.forEach(routeArr, function(item){  
                        if(item.id == routeId){
                            var filteredAddress = item.addresses.filter(function(address){
                                return selectAddressId.indexOf(address.addressId.toString()) > -1;
                            })
                            if(filteredAddress[0].isTemporary==1 && filteredAddress[0].isOneOfJob==1){
                                $scope.disablePermanentMove = true;
                            }
                            if(filteredAddress[0].days.length > 0){
                                selectedAddressObjArray.push({addressId: filteredAddress[0].addressId, dayName: moment($scope.selectedRouteDate).format('dddd').toLowerCase()})
                            } else {
                                selectedAddressObjArray.push({addressId: filteredAddress[0].addressId, dayName: ''});
                            }      
                            if(filteredAddress[0].skipToday==1 && (!filteredAddress[0].oneOfJobId || filteredAddress[0].oneOfJobId == 0)){
                                isSkipped = true;
                            }
                        }
                    })
                })
            } else {
                angular.forEach($rootScope.routes, function(routeArr, pIdx){
                    if(routeArr[routeIndex] && routeArr[routeIndex].id == routeId){
                        angular.forEach(routeArr[routeIndex].addresses, function(item){  
                            isSkipped = false;
                            if(selectAddressId.indexOf(item.addressId.toString()) > -1){
                                if(item.isTemporary==1 && item.isOneOfJob==0){
                                    $scope.disablePermanentMove = true;
                                }
                                if(item.days.length > 0){
                                    selectedAddressObjArray.push({isTemporary: item.isTemporary, addressId: item.addressId, dayName: moment($scope.selectedRouteDate).format('dddd').toLowerCase(),  isOneOfJob: item.isOneOfJob});
                                } else {
                                    selectedAddressObjArray.push({isTemporary: item.isTemporary, addressId: item.addressId, dayName: '', isOneOfJob: item.isOneOfJob});
                                }
                                if(item.skipToday==1  && (!item.oneOfJobId || item.oneOfJobId == 0)){
                                    isSkipped = true;
                                }
                            }
                        })
                    }
                })
            }
            countOneTimeJobExist = $rootScope.selectedAddressDetail.filter(data => data.isOneOfJob == 1 && data.selected)
            countRoutedJobExist = $rootScope.selectedAddressDetail.filter(data => data.isOneOfJob == 0 && data.selected && data.days.length > 0)
            if(countOneTimeJobExist.length > 0 && countRoutedJobExist.length == 0){
                $scope.disablePermanentMove = false;
            }
        }
        if(isSkipped){
            $scope.toastMessage('routeError', "A route visit you're trying to move is currently set to be skipped. Please undo the skip setting and try again.");
            return false;
        }
        postData = selectedAddressObjArray;
        $scope.selectedTempMoveDate = $scope.selectedRouteDate;
        var daysIndex = $scope.weekDays.indexOf(moment($scope.selectedRouteDate).format('dddd').toLowerCase());
        var dayName = $scope.weekDays[daysIndex];
        if($scope.isPastDate){
            $scope.selectedTempMoveDate = moment($filter('futureDate')(dayName, $scope.selectedRouteDate)).format('YYYY-MM-DD');
        } else {
            $scope.selectedTempMoveDate = $scope.selectedRouteDate;
        }
        if (routeId != 0 || routeId != '0') {
            var daysIndex = $scope.weekDays.indexOf(moment(selectedDate).format('dddd').toLowerCase());
            var dayName = $scope.weekDays[daysIndex];
            if($scope.isPastDate){
                $scope.selectedTempMoveDate = moment($filter('futureDate')(dayName, selectedDate)).format('YYYY-MM-DD');
            } else {
                $scope.selectedTempMoveDate = selectedDate;
            }
        }
        $scope.isProcessing = true;
        $scope.postDataforCheckAddressAssignment = angular.copy(postData);
        apiGateWay.send("/check_address_assignment", postData).then(function(response) {
            if (response.data.status == 200) {
                if(response.data.data!='1'){
                    var responseDays = response.data.data.toString().split(',');
                    if(responseDays.length > 0 && !$scope.isTempMove){
                        $scope.weekDaysAvailableForMove = responseDays;
                        if(responseDays.indexOf(dayName) > -1){
                            $scope.daysIndex = responseDays.indexOf(dayName);
                            $scope.daysIndexStart = responseDays.indexOf(dayName);
                        } else {
                            $scope.daysIndex = 0;
                            $scope.daysIndexStart = 0;
                        }
                    } else {
                        $scope.daysIndex = daysIndex
                        $scope.daysIndexStart = daysIndex
                    }
                    $scope.movePopupDate = moment().day($scope.weekDaysAvailableForMove[$scope.daysIndex]).format('YYYY-MM-DD');  
                    if(type != 'marker'){
                        $scope.helpMessage = response.data.message;
                    }
                }  else{
                    $scope.movePopupDate = moment().day(dayName).format('YYYY-MM-DD');
                    $scope.daysIndex = daysIndex;
                    $scope.daysIndexStart = daysIndex;
                    $scope.helpMessage = response.data.message;
                }
                if($scope.weekDaysAvailableForMove.length == 7 && $scope.isPastDate){
                    $scope.daysIndex = $scope.weekDays.indexOf(moment().format('dddd').toLowerCase());;
                    $scope.daysIndexStart = $scope.weekDays.indexOf(moment().format('dddd').toLowerCase());;
                    $scope.selectedTempMoveDate = moment().format('YYYY-MM-DD');  
                    $scope.movePopupDate = moment().format('YYYY-MM-DD'); 
                }
                $scope.openMovePopup();
            } else {
                $scope.toastMessage('routeError', response.data.message);
            }
            $scope.isProcessing = false;
            $scope.isopenMoveAddressPopupOpen = false;
        }, function(error){
            $scope.toastMessage('routeError', error);
            $scope.isProcessing = false;
            $scope.isopenMoveAddressPopupOpen = false;
        })
    }
    $scope.toggleMoveHelpTooltip = function(value){
        var current = $scope[value];
        $scope.toolTipMoveHelp = false;
        $scope.toolTipMoveToggleBtn = false;
        if(value){
            $scope[value] = !current;
        }
        if (!$scope.$$phase) $scope.$apply()
    }
    $(document).on( "click", '.technician-list-popup', function(e){
        if (e.target.id != 'toolTipMoveHelp' && e.target.id != 'toolTipMoveToggleBtn') {
            $scope.toggleMoveHelpTooltip();
        }
    });
    $scope.isMovePopupOn = false;
    $scope.routeModalDataShownSchedule = false;
    $scope.openMovePopup = function(){
        if($scope.isMovePopupOn) {
            return
        }
        $rootScope.getRouteByDateForPopup();
        if($scope.moveType != 'notRouted'){
            $scope.isTempMove = true; 
        }else{
            $scope.isTempMove = false; 
        }
        $scope.showDisableTooltip=false;
        $scope.isMovePopupOn = true;
        ngDialog.open({
            name: 'moveAddress',
            template: 'moveAddress.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {
                $scope.routeModalDataShownSchedule = false;
                $scope.isMovePopupOn = false;
                $scope.movingFromUnscheduledOneTimeJob = false;
                $rootScope.setFromDateMarker('');
                if($scope.isMarkerMove){
                    $rootScope.selectAddressIdArray = [];
                    $rootScope.selectedAddressIdArrayModel = {}; 
                    $rootScope.selectedAllAddressModel = {};
                }
                $scope.routeId = '';
                $rootScope.routeSearchKey = '';
                $scope.routeSearchBox.routeSearchText = ''; 
                $scope.helpMessage = '';
                $scope.movePopupDate = '';
                $rootScope.routesPopupList =[];
                $rootScope.allRoutesPopupList =[];
                $scope.daysIndex=0;
                $scope.weekDaysAvailableForMove = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                $scope.moveType = '';
                $scope.selectedTempMoveDate = '';
                $scope.isTempMove = true;
                $scope.toolTipMoveHelp = false;
                $scope.toolTipMoveToggleBtn = false;
                $scope.isopenMoveAddressPopupOpen = false;
                $rootScope.selectedFromTechIdforMoving = 0;
                $rootScope.selectedToTechIdforMoving = 0;
                $scope.postDataforCheckAddressAssignment = {};
            }
        });
        $timeout(function(){
            $scope.routeModalDataShownSchedule = true;
            let datePickerInput = document.querySelector('#datePickerInput'); 
            if (datePickerInput) {
                if (!$scope.isPastDate && $scope.selectedDateForMove) { 
                    datePickerInput.value = moment($scope.selectedDateForMove).format('YYYY-MM-DD') 
                } else {
                    datePickerInput.value = moment($scope.selectedTempMoveDate).format('YYYY-MM-DD')                     
                }     
            }            
        }, 100)
    }
    $scope.switchMove = function(){
        countOneTimeJobExist = $rootScope.selectedAddressDetail.filter(data => data.isOneOfJob == 1 && data.selected)
        countRoutedJobExist = $rootScope.selectedAddressDetail.filter(data => data.isOneOfJob == 0 && data.selected && data.days.length > 0)
        if(countOneTimeJobExist.length > 0 && countRoutedJobExist.length == 0){
            $scope.moveType = 'OneOfJob'
            $scope.helpMessage = '1'
        }
        let isDataHaveTempMovedJob = 0;
        if ($scope.postDataforCheckAddressAssignment && $scope.postDataforCheckAddressAssignment.length > 0) {
            angular.forEach($scope.postDataforCheckAddressAssignment, function(seletedAdress){
                if (seletedAdress.isTemporary > 0) {
                    isDataHaveTempMovedJob++;
                }
            })
        }
        if(!$scope.disablePermanentMove && isDataHaveTempMovedJob == 0){
            $scope.daysIndex = $scope.daysIndexStart
            $scope.toggleMoveHelpTooltip('toolTipMoveToggleBtn')
            $scope.isTempMove = !$scope.isTempMove;
            if($scope.isTempMove && $scope.moveType != 'notRouted'){
                if($scope.isPastDate){
                    $scope.selectedTempMoveDate = moment($filter('futureDate')($scope.weekDaysAvailableForMove[$scope.daysIndex], moment())).format('YYYY-MM-DD');
                }else{
                    $scope.selectedTempMoveDate = moment($filter('futureDate')($scope.weekDaysAvailableForMove[$scope.daysIndex], $scope.selectedRouteDate)).format('YYYY-MM-DD');
                }
            }
            $rootScope.getRouteByDateForPopup();
        } else if (isDataHaveTempMovedJob > 0) {
            $scope.toggleMoveHelpTooltip('toolTipMoveToggleBtn')
            $scope.showDisableTooltip = true;
        } else{
            $scope.toggleMoveHelpTooltip('toolTipMoveToggleBtn')
            $scope.showDisableTooltip = true;
        }
    }    
    $scope.datePickerOptionRoutePopupSchedule = { 
        format: 'YYYY-MM-DD', 
        showClear: false, 
        widgetParent: '#datePickerOptionRoutePopupSchedule',   
        minDate: moment().format('YYYY-MM-DD')     
    };
    $scope.changeWeekdaysForMovePopup  = function(currentIndex, direction){
        let hasDatePickerError = false;
        let datePickerInput = document.querySelector('#datePickerInput');             
        if(datePickerInput && direction == 'datepicker'){
            if (datePickerInput.value == '') {
                hasDatePickerError = true;
            }
            if (datePickerInput.value == moment($scope.selectedTempMoveDate).format('YYYY-MM-DD')) {
                hasDatePickerError = true;
            }
            if (datePickerInput.value != '') {                
                $scope.selectedTempMoveDate = moment(datePickerInput.value).format('YYYY-MM-DD');  
                let dayName = moment($scope.selectedTempMoveDate).format('dddd').toLowerCase(); 
                let index = $scope.weekDaysAvailableForMove.indexOf(dayName);
                if (index > -1) {
                    $scope.daysIndex = $scope.weekDaysAvailableForMove.indexOf(dayName);
                }
            }         
        }        
        var date = angular.copy($scope.selectedTempMoveDate);
        $rootScope.routeSearchKey = '';
        $scope.routeSearchBox.routeSearchText = ''; 
        if(direction == 'prev'){
            if($scope.isTempMove && $scope.weekDaysAvailableForMove.length > 1){ 
                if(!$scope.matchCurrentDate($scope.selectedTempMoveDate)){
                    $scope.selectedTempMoveDate = moment(date).subtract(1, 'days').format('YYYY-MM-DD');
                } else{
                    return false;
                }
            }
            if ($scope.moveType == 'notRouted' && !$scope.isTempMove) {
                if(!$scope.matchCurrentDate($scope.selectedTempMoveDate)){
                    $scope.selectedTempMoveDate = moment(date).subtract(1, 'days').format('YYYY-MM-DD');   
                    if(currentIndex == 0){
                        $scope.daysIndex = $scope.weekDaysAvailableForMove.length-1;
                    } else {
                        $scope.daysIndex = currentIndex-1;
                    }                           
                } else{
                    return false;
                }                
            } else {
                if(currentIndex == 0){
                    $scope.daysIndex = $scope.weekDaysAvailableForMove.length-1;
                } else {
                    $scope.daysIndex = currentIndex-1;
                }
            }
            if(datePickerInput) { datePickerInput.value = moment($scope.selectedTempMoveDate).format('YYYY-MM-DD') }
        }
        if(direction == 'next'){
            if($scope.isTempMove  && $scope.weekDaysAvailableForMove.length > 1){
                $scope.selectedTempMoveDate = moment(date).add(1, 'days').format('YYYY-MM-DD');
            }
            if ($scope.moveType == 'notRouted' && !$scope.isTempMove) {
                $scope.selectedTempMoveDate = moment(date).add(1, 'days').format('YYYY-MM-DD'); 
                if(currentIndex == $scope.weekDaysAvailableForMove.length-1){
                    $scope.daysIndex = 0;
                } else {
                    $scope.daysIndex = currentIndex+1;
                }              
            } else {
                if(currentIndex == $scope.weekDaysAvailableForMove.length-1){
                    $scope.daysIndex = 0;
                } else {
                    $scope.daysIndex = currentIndex+1;
                }
            }
            if(datePickerInput) { datePickerInput.value = moment($scope.selectedTempMoveDate).format('YYYY-MM-DD') }
        }
        if($scope.weekDaysAvailableForMove.length > 1 && !hasDatePickerError){
            $rootScope.getRouteByDateForPopup();
        }
    } 
    $scope.changeDateForTempMove = function(direction, selectedTempMoveDate){
        $scope.selectedTempMoveDate = angular.copy(selectedTempMoveDate); 
        var date = angular.copy(selectedRouteDate);
        if(direction == 'prev'){
            container.datepicker('update', new Date(moment(date).subtract(1, 'days')));
            $scope.selectedRouteDateForAddress = new Date(moment(date).subtract(1, 'days'))
        } else if(direction == 'next'){
            container.datepicker('update', new Date(moment(date).add(1, 'days')));
            $scope.selectedRouteDateForAddress = new Date(moment(date).add(1, 'days'))
        } else {
            if(!changeDateByArrowDirection){
                $scope.selectedRouteDateForAddress = new Date(moment(date));
            }
        }
    }
    $scope.moveAddress = function(id){
        $scope.isCurrDayDoesntMatchWithJob = false;
        var selectedDayName = '';
        var tempDayName = '';        
        if ($scope.isCurrDayExist && !$scope.movingFromUnscheduledOneTimeJob) {
            var weeknames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            selectedDayName = weeknames[$scope.daysIndex]; 
            var _activeDatesArr = []
            $scope.activeDates.forEach((value) => {
                _activeDatesArr.push(moment(value).format('YYYY-MM-DD'))                            
            })
            if(_activeDatesArr.length > 1 && $scope.moveType == 'notRouted' && !$scope.isTempMove) {
                selectedDayName = moment($scope.selectedTempMoveDate).format('dddd')
                selectedDayName = selectedDayName.toLowerCase()
            } else {
                selectedDayName = weeknames[$scope.daysIndex];  
            }
            var _selectedCurrDayArr = [];  
            var _selectedCurrDayArrUnique = [];  
            if($scope.checkDateSelectedJobs.length>0) {
                $scope.checkDateSelectedJobs.forEach(function(vjob){
                    if (vjob && vjob.currDay != '') {
                        _selectedCurrDayArr.push(capitalizeFirstLetter(vjob.currDay))
                        tempDayName = vjob.currDay;   
                        if (selectedDayName != tempDayName && !$scope.isTempMove) {
                            $scope.isCurrDayDoesntMatchWithJob = true;
                        }
                    }
                })
            }
            _selectedCurrDayArrUnique = [...new Set(_selectedCurrDayArr)]
            function capitalizeFirstLetter(string='') {
                if (string == '') {
                    return '';
                }                        
                return string.charAt(0).toUpperCase() + string.slice(1);
              }    
            $scope.movingDayRestrictedPropFromUnscheduledToRouteData.selectedDay = capitalizeFirstLetter(_selectedCurrDayArrUnique.join(', '));
            $scope.movingDayRestrictedPropFromUnscheduledToRouteData.destDay = capitalizeFirstLetter(selectedDayName);
            if ($scope.isCurrDayDoesntMatchWithJob) {
                ngDialog.open({    
                    name: 'moveError',
                    template: 'movingDayRestrictedPropFromUnscheduledToRoute_moveError.html',
                    className: 'ngdialog-theme-default v-center',
                    overlay: true,
                    closeByNavigation: true,
                    scope: $scope,
                    preCloseCallback: function () {
                        $scope.movingDayRestrictedPropFromUnscheduledToRouteData.selectedDay = '';
                        $scope.movingDayRestrictedPropFromUnscheduledToRouteData.destDay = '';
                    }
                })
                return
            } else {
                $scope.moveAddressAfter(id)
            }
        }  else {
            $scope.moveAddressAfter(id)    
        }
    }
    $rootScope.settedFromDateMarker = '';
    $rootScope.setFromDateMarker = (date) => {
        $rootScope.settedFromDateMarker = date;
    }
    $scope.moveAddressAfter = function(id) {
        var postData = {
            addressId: angular.copy($scope.jobPop? $scope.jobPop : $rootScope.selectAddressIdArray),
            routeId: id,
            fromRoute:$scope.routeId,
            date: moment($filter('futureDate')($scope.weekDaysAvailableForMove[$scope.daysIndex], $scope.selectedRouteDate)).format('YYYY-MM-DD'),
            fromDate:moment($scope.selectedDateForMove).format('YYYY-MM-DD'),
            isTempMove: $scope.isTempMove,
        }
        if($scope.isTempMove){
            postData.date = moment($filter('futureDate')($scope.weekDaysAvailableForMove[$scope.daysIndex], $scope.selectedTempMoveDate)).format('YYYY-MM-DD')
        }
        if(!$scope.isTempMove && $scope.moveType != 'notRouted'){                  
            var _targetDay = moment(postData.date).format('dddd');
            var _selectedItemDate = moment(postData.fromDate).format('YYYY-MM-DD');
            var _todayDate = moment().format('YYYY-MM-DD');
            var _isSelectedItemisFromFuture = moment(_todayDate).isBefore(_selectedItemDate);
            var _isSelectedItemisFromPast = moment(_todayDate).isAfter(_selectedItemDate);
            var _isSelectedItemisFromToday = _selectedItemDate === _todayDate;
            var _daysDifference = moment(_selectedItemDate).diff(moment(_todayDate), 'days')            
            var _canBeMoveToTheseDates = []            
            if (_isSelectedItemisFromToday || _isSelectedItemisFromPast) {
                for (let i = 0; i < 7; i++) {
                    _canBeMoveToTheseDates.push(moment(_selectedItemDate).add(i, 'days').format('YYYY-MM-DD'))
                }                
            }
            if (_isSelectedItemisFromFuture) {
                _canBeMoveToTheseDates.push(moment(_todayDate).format('YYYY-MM-DD'))
                for (let i = 0; i < _daysDifference; i++) {
                    _canBeMoveToTheseDates.push(moment(_selectedItemDate).subtract(i, 'days').format('YYYY-MM-DD'))
                } 
                for (let i = 1; i < 7 - _daysDifference; i++) {
                    _canBeMoveToTheseDates.push(moment(_selectedItemDate).add(i, 'days').format('YYYY-MM-DD'))
                }                
            }
            _canBeMoveToTheseDates = _canBeMoveToTheseDates.sort();
            var _canBeMoveToTheseDatesByDay = [];
            _canBeMoveToTheseDates.forEach((date)=>{
                _canBeMoveToTheseDatesByDay.push({
                    date: date,
                    day: moment(date).format('dddd')
                })
            });
            var _destDateObj = _canBeMoveToTheseDatesByDay.find(x => x.day === _targetDay);
            if (_destDateObj) {
                var _destDate = _destDateObj.date;         
                postData.date = _destDate;
            }
        }
        if(!$scope.isTempMove && $scope.moveType == 'notRouted'){                  
            postData.date = moment($scope.selectedTempMoveDate).format('YYYY-MM-DD');
        }
        $scope.isProcessing = true;
        postData.assignType = 'moveButton';          
        if ($rootScope.settedFromDateMarker != '') {
            postData.fromDate = moment($rootScope.settedFromDateMarker).format('YYYY-MM-DD')
            $rootScope.setFromDateMarker('')
        }       
        postData.fromTechnician = Number($rootScope.selectedFromTechIdforMoving);
        postData.toTechnician = Number($rootScope.selectedToTechIdforMoving);
        let addressCount = postData.addressId.length ? postData.addressId.length : 0;                
        apiGateWay.send("/assign_address_route", postData).then(function(response) {
            if (response.data.status == 200) {
                if (response.data.data.routeAlreadyExist && response.data.data.routeAlreadyExist.length === addressCount) {                    
                    $scope.routeMoveDataExist = response.data.data.routeAlreadyExist;
                    ngDialog.closeAll();
                    $scope.showMoveAddressExist();
                    $scope.isProcessing = false;
                    return
                } 
                $scope.sendResponseForCheckAlreadyMoved(response.data.data);               
                $scope.sendResponseForCheckEndDatePassed(response.data.data);
                $scope.sendResponseForCheckRouteSkipped(response.data.data);
                $scope.changeStatus(postData.addressId[0].addressId);
                $scope.jobPop = null;
                $rootScope.selectAddressIdArray = [];
                $rootScope.selectedAddressIdArrayModel = {};
                if(postData.routeId == 0 || postData.fromRoute == 0){
                    $rootScope.routeCache = []
                }
                $rootScope.selectedAllAddressModel = {};
                $scope.selectedAllJobModel = {};
                $scope.selectedJobIdArrayModel = {};
                ngDialog.closeAll();
                angular.forEach($rootScope.routes, function(routeArr, pIdx){
                    angular.forEach(routeArr, function(route, idx){
                        if(route.id == postData.fromRoute || route.id == id){
                            const allRoutes = $rootScope.routes.flat();
                            let _xToRoute = allRoutes.find(item => item.id == postData.routeId)
                            let _xFromRoute = allRoutes.find(item => item.id == postData.fromRoute) 
                            $rootScope.isProcessingDateChange = true;                           
                            if (_xToRoute) $rootScope.getAddress(_xToRoute, true, $scope.isMarkerMove);
                            if (_xFromRoute) $rootScope.getAddress(_xFromRoute, true, $scope.isMarkerMove);   
                            $scope.googleMapArgs.method.removeRoute(postData.routeId);
                            $scope.googleMapArgs.method.removeRoute(postData.fromRoute);
                        }
                    });
                });
                var data = response.data.data;
                var routeOrigin = data.addressId && data.addressId[0] ? data.addressId[0].mainRoute : {};
                var originRouteId = routeOrigin && routeOrigin.routeId ? routeOrigin.routeId : '';
                angular.forEach($scope.activeDates, function (aDate, index) {
                        var isRouteIndex = $rootScope.routes[index].filter(function(e){return (e.id == originRouteId)});
                        if(isRouteIndex && isRouteIndex.length > 0 ){
                            $scope.isOptimize[index] = [];
                            const allRoutes = $rootScope.routes.flat();
                            $rootScope.isProcessingDateChange = true;
                            let _xToRoute = allRoutes.find(item => item.id == postData.routeId)
                            let _xFromRoute = allRoutes.find(item => item.id == postData.fromRoute)                            
                            if (_xToRoute) $rootScope.getAddress(_xToRoute, true);
                            if (_xFromRoute) $rootScope.getAddress(_xFromRoute, true);   
                            $scope.googleMapArgs.method.removeRoute(postData.routeId);
                            $scope.googleMapArgs.method.removeRoute(postData.fromRoute);                            
                        }
                });
                $scope.routeId = '';
                if($scope.isMarkerMove){
                    $scope.isMarkerMove = false;
                } else {
                }   
                if (postData.routeId == 0 || postData.fromRoute == 0) {
                    $scope.getNotRoutedAddress('', true);
                    $scope.getNotRoutedJobs('', true);                    
                }
                if(response.data.message == "To drag or move to this route, go back and select the location for the same day as route."){
                    $scope.toastMessage('routeError', response.data.message);
                }else if(response.data.data.routeAlreadyExist || response.data.message == "Address(es) are already assigned to the Route"){
                    $scope.routeMoveDataExist = response.data.data.routeAlreadyExist;
                    $scope.showMoveAddressExist();
                }else{
                    $scope.toastMessage('routeSuccess', response.data.message);
                }
            } else {
                $scope.toastMessage('routeError', response.data.message);
                if(!$scope.isMarkerMove){
                    $scope.unscheduledLoading.nonRoutedAddress = false;
                    $scope.unscheduledLoading.nonRoutedJob = false;            
                }
            }
            $scope.isProcessing = false;
        }, function(error){
            $scope.toastMessage('routeError', error);
            $scope.isProcessing = false;
            if(!$scope.isMarkerMove){
                $scope.unscheduledLoading.nonRoutedAddress = false;
                $scope.unscheduledLoading.nonRoutedJob = false;            
            }
        })
    }
    $scope.moveDragAddress = function(sourceRoute, sourceRouteId, destRoute, destRouteId, addressId, jobId='', sourceDate='', destDate='', fromTechnician='0', toTechnician='0', currDay=''){  
        sourceDate = sourceDate || $scope.selectedRouteDate;
        destDate = destDate || $scope.selectedRouteDate;
        if ($scope.isDroppedToWrongDate) {      
            $scope.isDroppedToWrongDate = false;      
            return
        }
        var postData = {
            addressId:[{"addressId":addressId,"jobId":jobId}],
            routeId: destRouteId,
            date: moment(destDate).format('YYYY-MM-DD'),
            fromRoute: sourceRouteId,
            fromDate:moment(sourceDate).format('YYYY-MM-DD'),
            fromTechnician: Number(fromTechnician),
            toTechnician: Number(toTechnician)
        }
        if (postData.fromRoute == 0 && currDay != '') {
            postData.addressId[0].currDay = currDay
        }
        if(sourceRouteId == 0 || destRouteId == 0){
            $scope.unscheduledLoading.nonRoutedAddress = true;
            $scope.unscheduledLoading.nonRoutedJob = true;            
        } 
        postData.assignType = 'drag';
        apiGateWay.send("/assign_address_route", postData).then(function(response) {
            if (response.data.status == 200) {
                $scope.sendResponseForCheckAlreadyMoved(response.data.data);
                $scope.sendResponseForCheckEndDatePassed(response.data.data);
                $scope.sendResponseForCheckRouteSkipped(response.data.data);
                $scope.changeStatus(postData.addressId[0].addressId);
                $scope.jobPop = null;
                $rootScope.selectAddressIdArray = [];
                $rootScope.selectedAddressIdArrayModel = {};
                var data = response.data.data;
                var routeOrigin = data.addressId && data.addressId[0] ? data.addressId[0].mainRoute : {};
                var originRouteId = routeOrigin && routeOrigin.routeId ? routeOrigin.routeId : '';
                angular.forEach($scope.activeDates, function (aDate, index) {
                        var isRouteIndex = $rootScope.routes[index].filter(function(e){return (e.id == sourceRouteId || e.id == destRouteId || e.id == originRouteId)});
                        if(isRouteIndex && isRouteIndex.length > 0 ){
                            $scope.isOptimize[index] = [];
                            const allRoutes = $rootScope.routes.flat();
                            let _xToRoute = allRoutes.find(item => item.id == postData.routeId)
                            let _xFromRoute = allRoutes.find(item => item.id == postData.fromRoute) 
                            $rootScope.isProcessingDateChange = true;                           
                            if (_xToRoute) $rootScope.getAddress(_xToRoute, true);
                            if (_xFromRoute) $rootScope.getAddress(_xFromRoute, true);                                                              
                            $scope.googleMapArgs.method.removeRoute(postData.routeId);
                            $scope.googleMapArgs.method.removeRoute(postData.fromRoute);
                        }
                });
                if(postData.routeId == 0 || postData.fromRoute == 0){
                    $scope.getNotRoutedAddress('', true);
                    $scope.getNotRoutedJobs('', true);
                    $rootScope.routeCache = [];
                }
               if(response.data.data.routeAlreadyExist || response.data.message == "Address(es) are already assigned to the Route"){
                    $scope.routeMoveDataExist = response.data.data.routeAlreadyExist;
                    $scope.showMoveAddressExist();   
                }else{
                    $scope.toastMessage('routeSuccess', response.data.message);
                }
            } else {
                $scope.toastMessage('routeError', response.data.message);
                if(sourceRouteId == 0 || destRouteId == 0){
                    $scope.unscheduledLoading.nonRoutedAddress = false;
                    $scope.unscheduledLoading.nonRoutedJob = false;            
                }
            }
        }, function(error){
            $scope.toastMessage('routeError', error);
            if(sourceRouteId == 0 || destRouteId == 0){
                $scope.unscheduledLoading.nonRoutedAddress = false;
                $scope.unscheduledLoading.nonRoutedJob = false;            
            }
        })
    }
    $scope.changeStatus = function (addressId) {
        $scope.isChangingStatus = true;
        apiGateWay.get("/customer/change_status", {'addressId': addressId }).then(function (response) {
            if (response.status == 200) {
                $scope.getUpdatedStatus(addressId);
                $scope.isChangingStatus = false;
            } else {
                $scope.isChangingStatusError = response.message;
            }
            $scope.isChangingStatus = false;
        }, function (error) {
            $scope.isChangingStatusError = error;
            $scope.isChangingStatus = false;
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
    $scope.showMoveAddressExist = function(){  
        ngDialog.open({
            template: 'addAddressExist.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            closeByDocument: false,
            preCloseCallback: function () {
            }
        });
    }
    $scope.hideRoute = function(route, routeIndex, type='', parentIndex = ''){  
        $scope.isProcessing = true; 
        var tempRoute = angular.copy(route);
        var postData = {
            routeId: tempRoute.id
        }
        if(type == 'notRouted'){
            postData.routeId = 0
        }
        if(tempRoute.isHidden){
            postData.hide = 0;
        } else {
            postData.hide = 1;
        }   
        if(type == 'notRouted'){
            $scope.emptyNotRouted[0].isHidden = postData.hide;
            if($scope.notRoutedAddressList.length > 0 ){ $scope.notRoutedAddressList[0].isHidden = postData.hide }
            if(postData.hide){
                $scope.googleMapArgs.method.removeAllMarkers() 
            } else {
                $scope.generateNonRoutedMarkers("allNonRouted");
            }
        } else {
            $rootScope.routes[parentIndex][routeIndex].isHidden = postData.hide;
            if(postData.hide){
                $scope.googleMapArgs.method.removeRoute(tempRoute.id) 
            } else {
                $scope.googleMapArgs.method.setSingleRoute($rootScope.routes[parentIndex][routeIndex]).then(function(){
                    $scope.resetMapZoom();
                    $rootScope.zeroRoute[$rootScope.routes[parentIndex][routeIndex].id] = false;
                }, function(error){
                    if(error.error.apiStatus == "ZERO_RESULTS"){
                        $rootScope.zeroRoute[$rootScope.routes[parentIndex][routeIndex].id] = true;
                    }
                });
            }
        }
        $scope.checkAllRoutIsHide()
        clearInterval($scope.hideShowIntervalUnscheduled);
        $scope.hideShowIntervalUnscheduled = setTimeout(function(){
            apiGateWay.send("/set_hidden_status_route", postData).then(function(response) {
                if (response.data.status == 200) {     
                    $scope.resetMapZoom();
                } else {
                    $scope.toastMessage('routeError', response.data.message);
                }
                $scope.isProcessing = false;
            }, function(error){
              $scope.toastMessage('routeError', error);
              $scope.isProcessing = false;
            })
        }, 500)       
    }
    $scope.lockRoute = function(route, routeIndex, parentIndex){  
        var postData = {
            routeId: route.id
        }
        if(route.isLocked){
            postData.lock = 0;
        } else {
            postData.lock = 1;
        }      
       apiGateWay.send("/set_lock_status", postData).then(function(response) {
           if (response.data.status == 200) {     
            $rootScope.routes[parentIndex][routeIndex].isLocked = postData.lock;
           } else {
               $scope.toastMessage('routeError', response.data.message);
           }
           $scope.isProcessing = false;
       }, function(error){
         $scope.toastMessage('routeError', error);
       })
    }    
    $scope.hideShowAllRoute = function(route, routeIndex){         
        var routeIds = [0];
        angular.forEach($rootScope.routes, function(routeArr){
            angular.forEach(routeArr, function(item){
                routeIds.push(item.id)
            })
        })      
        $rootScope.isHideAllRoute = !$rootScope.isHideAllRoute;
        var postData = {
            routeIds: routeIds,
            hide: $rootScope.isHideAllRoute
        }
        if($rootScope.isHideAllRoute){
            angular.forEach($rootScope.routes, function(routeArr, parentIndex){
                angular.forEach(routeArr, function(item, index){
                    if (routeIds.includes(item.id)) {
                        $scope.googleMapArgs.method.removeRoute(item.id)
                        $rootScope.routes[parentIndex][index].isHidden = 1;
                    }
                });
            });
            if($scope.emptyNotRouted && $scope.emptyNotRouted.length > 0){
                $scope.emptyNotRouted[0].isHidden = 1;
            }
            $scope.resetMapZoom();
            $scope.googleMapArgs.method.removeAllMarkers();
            $rootScope.isProcessingDateChange = false;
        } else {
            $scope.updateMapOnRouteChange('setAllShow');
        }
        clearInterval($scope.hideShowInterval);
        $scope.hideShowInterval = setTimeout(function(){
            $scope.isProcessing = true;
            apiGateWay.send("/set_hide_all_status", postData).then(function(response) {
                if (response.data.status == 200) {
                } else {
                    $scope.toastMessage('routeError', response.data.message);
                }
                $scope.isProcessing = false;
            }, function(error){
                    $scope.toastMessage('routeError', error);
                    $scope.isProcessing = false;
            })    
        }, 500)        
    }
    $scope.checkAllRoutIsHide = function(){
        const allRoutes = $rootScope.routes.flat();
        $rootScope.isHideAllRoute = allRoutes.findIndex(item => item.isHidden == 0) < 0;        
    }
    $scope.skipAddress = function(route, routeIndex, address, addressIndex, parentIndex){   
        $scope.isProcessing = true;         
        var postData = {
            addressId: address.addressId,
            routeId: route.id
        }
        if(address.skipToday){
            postData.skip = null;
        } else {
            postData.skip = 1;
        }   
        if($scope.activeDates[parentIndex]){
            postData.date = moment($scope.activeDates[parentIndex]).format('YYYY-MM-DD')
        } else {
            return false;
        }
        apiGateWay.send("/set_skip_status_route", postData).then(function(response) {
            if (response.data.status == 200) {
                $rootScope.routes[parentIndex][routeIndex].addresses[addressIndex].skipToday = postData.skip;
                if($scope.selectedAddressDetail && $scope.selectedAddressDetail.length>0) {
                    $scope.selectedAddressDetail.forEach(function(value,index){
                        if (value.addressId == $rootScope.routes[parentIndex][routeIndex].addresses[addressIndex].addressId) {
                            $scope.selectedAddressDetail[index].skipToday = postData.skip
                        }
                    })
                }
            } else {
                $scope.toastMessage('routeError', response.data.message);
            }
            $scope.isProcessing = false;
        }, function(error){
        $scope.toastMessage('routeError', error);
        $scope.isProcessing = false;
        })
    }
    $rootScope.showNearestLocation = function(routeId='', id='', lat='', long='', address='', type=''){      
        $scope.isProcessing = true;
        $scope.googleMapArgs.method.removeAllMarkers().then(function(response){
        }, function(error){
        }); 
        $scope.googleMapArgs.method.removeAllRoutes().then(function(response){
        }, function(error){
        });
        var jobStatusImage = '';
        if(type ==''){
            angular.forEach($rootScope.routes, function(routeArr, parentIndex){  
                angular.forEach(routeArr, function(item, index){  
                    if(item.id == routeId){
                        var filteredAddress = item.addresses.filter(function(address){
                            return id == address.addressId;
                        })
                        if(filteredAddress.length > 0){
                            jobStatusImage = filteredAddress[0].jobStatusImage;   
                        }
                    }
                })
            })
            $scope.postData = {
                date:moment($scope.selectedRouteDate).format('YYYY-MM-DD'),
                latitude:lat.toString(),
                longitude:long.toString(),
                addressId:id,
                routeId:routeId,
                limit:$scope.nearestLocationLimit,
                jobStatusImage:jobStatusImage
            }
        } else {
            $scope.postData.limit = $scope.nearestLocationLimit
        } 
        apiGateWay.send("/get_nearest_locations", $scope.postData).then(function(response) {
            if (response.data.status == 200) {   
                response.data.data = $scope.updatePrimaryAddressNode(response.data.data)
                var data = response.data.data
                data[0].jobStatusImage =  $scope.postData.jobStatusImage;
                var primaryAddress = response.data.data[0].firstName+' - '+response.data.data[0].address;                
                $scope.googleMapArgs.method.setMultipleMark(data, type='nearest');
                $scope.addressForNearest = primaryAddress;
            } else {
                $scope.toastMessage('routeError', response.data.message);
            }
            $scope.isProcessing = false;
        }, function(error){
            $scope.toastMessage('routeError', error);
            $scope.isProcessing = false;
        })
    }
    $rootScope.showNearestLocation = function(routeId='', id='', lat='', long='', address='', type=''){
        $scope.isProcessing = true;
        $scope.googleMapArgs.method.removeAllMarkers().then(function(response){
        }, function(error){
        }); 
        $scope.googleMapArgs.method.removeAllRoutes().then(function(response){
        }, function(error){
        });
        var jobStatusImage = '';
        if(type ==''){
            angular.forEach($rootScope.routes, function(routeArr, parentIndex){  
                angular.forEach(routeArr, function(item, index){  
                    if(item.id == routeId){
                        var filteredAddress = item.addresses.filter(function(address){
                            return id == address.addressId;
                        })
                        if(filteredAddress.length > 0){
                            jobStatusImage = filteredAddress[0].jobStatusImage;   
                        }
                    }
                })
            })
            $scope.postData = {
                date:moment($scope.selectedRouteDate).format('YYYY-MM-DD'),
                latitude:lat.toString(),
                longitude:long.toString(),
                addressId:id,
                routeId:routeId,
                limit:$scope.nearestLocationLimit,
                jobStatusImage:jobStatusImage
            }
        } else {
            $scope.postData.limit = $scope.nearestLocationLimit
        } 
        apiGateWay.send("/get_nearest_locations", $scope.postData).then(function(response) {
            if (response.data.status == 200) {   
                response.data.data = $scope.updatePrimaryAddressNode(response.data.data)
                var data = response.data.data
                data[0].jobStatusImage =  $scope.postData.jobStatusImage;
                var primaryAddress = response.data.data[0].firstName+' - '+response.data.data[0].address;                
                $scope.googleMapArgs.method.setMultipleMark(data, type='nearest');
                $scope.addressForNearest = primaryAddress;
            } else {
                $scope.toastMessage('routeError', response.data.message);
            }
            $scope.isProcessing = false;
        }, function(error){
            $scope.toastMessage('routeError', error);
            $scope.isProcessing = false;
        })
    }
    $scope.clearNearestLocation  = function(){  
        $scope.reloadPage();
    }
    var tempLimitText = '',
        limitTextTimeout;
    $scope.nearestLimitChange  = function(limit){       
        if (limitTextTimeout) $timeout.cancel(limitTextTimeout);
        if(limit == $scope.nearestLocationLimit || !limit || limit==0 | limit=='00' || limit=='000'){
            return false;
        }
        tempLimitText = limit;
        limitTextTimeout = $timeout(function() {
            $scope.nearestLocationLimit = tempLimitText;                
            $scope.showNearestLocation('','','','','','limitChange') 
        }, 1000); 
    }
    $scope.toastMessageTimeout = '';
    $scope.toastMessage = function(type, message, duration=2000 ){   
        if (type === 'routeError') {
            duration = 5000
        }
        if($scope.toastMessageTimeout) {
            clearTimeout($scope.toastMessageTimeout); 
            $scope.routeError = '';
            $scope.routeSuccess = '';
        }
        $scope[type] = message;
        $scope.toastMessageTimeout = setTimeout(function() {
            $scope.routeError = '';
            $scope.routeSuccess = '';
            if (!$scope.$$phase) $scope.$apply()
        }, duration);
    }
    $scope.setOpenRoute = function(id, addressId, routeIndex, parentIndex='', uniqueId=''){
        $scope.isMarkerMove = false
        if(id != $scope.selectedCheckboxRoute){
            $rootScope.selectedAddressIdArrayModel = {}
            $scope.selectedCheckboxRoute = id;
            $rootScope.selectedAddressIdArrayModel[addressId] = true;
        } else {
            $scope.selectedCheckboxRoute = id;
        }
        $rootScope.selectedAllAddressModel = {};
        $rootScope.selectedAllAddressModel['_'+id] = true;
        if(id && id > 0){
            angular.forEach($rootScope.routes[parentIndex][routeIndex].addresses, function(address, i){
                if(address.oneOfJobId && address.oneOfJobId > 0 && !$rootScope.selectedAddressIdArrayModel[address.addressId+'-'+address.oneOfJobId] && !address.IsDoneProgressNoAccess){
                    $rootScope.selectedAllAddressModel['_'+id] = false;
                }else if((!address.oneOfJobId || address.oneOfJobId == 0) && !$rootScope.selectedAddressIdArrayModel[address.addressId+'_'+address.id] && !address.IsDoneProgressNoAccess){
                    $rootScope.selectedAllAddressModel['_'+id] = false;
                }
            })
        }else{
            angular.forEach($scope.notRoutedAddressList, function(address, i){
                if(!$rootScope.selectedAddressIdArrayModel[address.addressId+'_'+i]){
                    $rootScope.selectedAllAddressModel['_0'] = false;
                }
            })
        }
        if(uniqueId && uniqueId != '' && uniqueId != 0){
            angular.forEach($rootScope.routes[parentIndex][routeIndex].addresses, function(address, i){
                if(address.groupAddress == uniqueId) {
                    $rootScope.selectedAddressDetailModel[uniqueId] = {
                        id: uniqueId,
                        routeId: id,
                        routeIndex: routeIndex,
                        addressId: address.addressId,
                        days: address.days,
                        currDay: address.currDay ? address.currDay : '',
                        isTemporary: address.isTemporary ? address.isTemporary : 0,
                        oneOfJobId: address.oneOfJobId,
                        isOneOfJob: address.isOneOfJob,
                        skipToday: address.skipToday,
                        selected: $rootScope.selectedAddressDetailModel[uniqueId] == undefined ? true : !$rootScope.selectedAddressDetailModel[uniqueId]['selected']
                    }
                    $scope.flushCacheSelectedAddressDetailModel(id);
                }
            })
        }
    }
    $scope.flushCacheSelectedAddressDetailModel = (id) => {
        var _arr = Object.keys($rootScope.selectedAddressDetailModel);
        if (_arr.length > 0) {            
            _arr.forEach(function(key) {
                if($rootScope.selectedAddressDetailModel[key] && $rootScope.selectedAddressDetailModel[key]['routeId'] !== id){
                    delete $rootScope.selectedAddressDetailModel[key]
                }
            });
        }
    }
    $scope.setOpenJobRoute = function(id, addressId, routeIndex){
        $scope.isMarkerMove = false
        if(id != $scope.selectedJobCheckboxRoute){
            $scope.selectedJobIdArrayModel = {}
            $scope.selectedJobCheckboxRoute = id;
            $scope.selectedJobIdArrayModel[addressId] = true;
        } else {
            $scope.selectedJobCheckboxRoute = id;
        }
        $scope.selectedAllJobModel = {};
        $scope.selectedAllJobModel['_'+id] = true;
        if(id && id > 0){
            angular.forEach($rootScope.routes[routeIndex].addresses, function(address, i){
                if(!$scope.selectedJobIdArrayModel[address.addressId+'-'+address.oneOfJobId] && !address.IsDoneProgressNoAccess){
                    $scope.selectedAllJobModel['_'+id] = false;
                }
            })
        }else{
            angular.forEach($scope.notRoutedJobList, function(address, i){
                if(!$scope.selectedJobIdArrayModel[address.addressId+'-'+address.jobId]){
                    $scope.selectedAllJobModel['_0'] = false;
                }
            })
        }
    }
    $scope.selectAllAddressOfRoute = function(id, routeIndex, parentIndex=''){       
        var currentValue = angular.copy($scope.selectedAllAddressModel['_'+id]) 
        $scope.isMarkerMove = false
        $rootScope.selectedAllAddressModel = {};
        $rootScope.selectedAllAddressModel['_'+id] = currentValue;
        $rootScope.selectAddressIdArray = [];
        $rootScope.selectedAddressIdArrayModel = {};
        $rootScope.selectedAddressDetailModel = {}
        if(currentValue){
            if(id != 0){
                angular.forEach($rootScope.routes[parentIndex][routeIndex].addresses, function(address, i){  
                    if(address.oneOfJobId && address.oneOfJobId > 0){
                        $rootScope.selectedAddressIdArrayModel[address.addressId+'-'+address.oneOfJobId] = address.IsDoneProgressNoAccess ? false : true;
                        $scope.feedAllChecks(address, id, routeIndex)
                    }else{
                        $rootScope.selectedAddressIdArrayModel[address.addressId+'_'+address.id] = address.IsDoneProgressNoAccess ? false : true;
                        $scope.feedAllChecks(address, id, routeIndex)
                    }
                })
            } else {
                angular.forEach($scope.notRoutedAddressList, function(address, i){
                    $rootScope.selectedAddressIdArrayModel[address.addressId+'_'+i] = true;
                    $scope.feedAllChecks(address, id, routeIndex)
                })
            }
            $scope.selectedCheckboxRoute = id;
        }
    }
    $scope.feedAllChecks = (address, id, routeIndex) => {
        $rootScope.selectedAddressDetailModel[address.groupAddress] = {
            id: address.groupAddress,
            routeId: id,
            routeIndex: routeIndex,
            addressId: address.addressId,
            days: address.days,
            currDay: address.currDay ? address.currDay : '',
            isTemporary: address.isTemporary ? address.isTemporary : 0,
            oneOfJobId: address.oneOfJobId,
            isOneOfJob: address.isOneOfJob,
            skipToday: address.skipToday,
            selected: $rootScope.selectedAddressDetailModel[address.groupAddress] == undefined ? true : !$rootScope.selectedAddressDetailModel[address.groupAddress]['selected']
        }
        $scope.flushCacheSelectedAddressDetailModel(id);
    }
    $scope.selectAllJobOfRoute = function(id, routeIndex){
        var currentValue = angular.copy($scope.selectedAllJobModel['_'+id]) 
        $scope.isMarkerMove = false
        $scope.selectedAllJobModel = {};
        $scope.selectedAllJobModel['_'+id] = currentValue;
        $scope.selectJobIdArray = [];
        $scope.selectedJobIdArrayModel = {};
        if(currentValue){
            if(id != 0){
                angular.forEach($rootScope.routes[routeIndex].addresses, function(address, i){
                    $scope.selectedJobIdArrayModel[address.addressId+'-'+address.oneOfJobId] = address.IsDoneProgressNoAccess ? false : true;
                })
            } else {
                angular.forEach($scope.notRoutedJobList, function(address, i){
                    $scope.selectedJobIdArrayModel[address.addressId+'-'+address.jobId] = true;
                })
            }
            $scope.selectedJobCheckboxRoute = id;
        } 
    }
    $scope.addCircle = function(){
        $rootScope.addSelection = !$rootScope.addSelection;
        $scope.googleMapArgs.method.drawCircle();
    }
    $( ".bottom-col" ).scroll(function() {       
        if($scope.statusIconElement){           
            $scope.setBoxStatusPopup = {};   
            if (!$scope.$$phase) $scope.$apply()     
        }        
    });
    $scope.setPopupStatusPosition = function(e){
        var alignBottom = false;
        var ele = e.parentNode.parentNode;
        var dd = document.getElementsByClassName('set-job-status-box')[0]; 
        if(ele.getBoundingClientRect().bottom+50 > document.getElementById('rt-sidebar').getBoundingClientRect().bottom){
            alignBottom = true;
        } else {
            alignBottom = false;
        }
        var offsetTop = ele.getBoundingClientRect().top;
        var offsetBottom = ele.getBoundingClientRect().bottom;
        var offsetLeft = ele.getBoundingClientRect().right;
        var st = ele.scrollTop;
        ddt = (offsetTop-st);  
        if(alignBottom){
            dd.style.bottom =  (Math.abs((ele.getBoundingClientRect().bottom-document.getElementById('rt-sidebar').getBoundingClientRect().bottom))+3) + 'px';
        } else {
            dd.style.top =  ddt + 'px';
        }               
        dd.style.left = offsetLeft +'px';
    }
    $scope.openSetBoxStatusPopup = function(id, e){          
        if($scope.setBoxStatusPopup['_'+id]){
            $scope.statusIconElement = '';
            $scope.setBoxStatusPopup = {};          
        } else {
            $scope.statusIconElement = e.currentTarget;            
            $scope.setBoxStatusPopup = {};
            $scope.setBoxStatusPopup['_'+id] = true;
            $timeout(function(){
                $scope.setPopupStatusPosition(e.currentTarget);
            });           
        }
    }
    $scope.changeJobStatusConfirmedAPI = (selectedDate, status, addressId, addressIndex, routeId, oneOfJobId, parentIndex) => {
        if ($scope.openChangeJobStatusConfirmationModal) {
            $scope.openChangeJobStatusConfirmationModal.close();
        } 
        var postData = {
            "date": moment(selectedDate).format('YYYY-MM-DD'), 
            "status": status,
            "oneOfJobId" : "",
            "addressId" : addressId
        }
        if(oneOfJobId && oneOfJobId != 0){
            postData["oneOfJobId"] = oneOfJobId.toString(); 
            postData["forcedByAdmin"] = 1;
        }
        apiGateWay.send("/set_job_status", postData).then(function(response) {
            if (response.data.status == 200) {
                if (response.data.data && response.data.data.status == "Closed" && response.data.data.oneOfJobId) {
                    apiGateWay.send("/create_one_job_invoice", {
                        "jobId": postData.oneOfJobId
                    }).then(function(response) {
                        
                    }, function(error){
                        $scope.toastMessage('routeError', response.data.message);
                    })
                }
                const allRoutes = $rootScope.routes.flat();
                let _xJobStatusRoute = allRoutes.find(item => item.id == routeId)
                if (_xJobStatusRoute) $rootScope.getAddress(_xJobStatusRoute, true);
                $scope.setBoxStatusPopup = {};
                $scope.toastMessage('routeSuccess', response.data.message);
            } else {
                $scope.toastMessage('routeError', response.data.message);
            }            
        }, function(error){
            $scope.toastMessage('routeError', error);        
        })
    }
    $scope.openChangeJobStatusConfirmation = (selectedDate, status, addressId, addressIndex, routeId, oneOfJobId, parentIndex) => {
        $scope.selectedJobForStatusChangeData = {
            selectedDate: selectedDate,
            status: status,
            addressId: addressId,
            addressIndex: addressIndex,
            routeId: routeId,
            oneOfJobId: oneOfJobId,
            parentIndex: parentIndex,
            selectedJobType: oneOfJobId && oneOfJobId != 0 ? 'oneTimeJob' : 'routeStop'
        }
        $scope.openChangeJobStatusConfirmationModal = ngDialog.open({            
            id  : 11,
            template: "templates/openChangeJobStatusConfirmation.html?ver="+$rootScope.PB_WEB_VERSION,
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {
                $scope.selectedJobForStatusChangeData = {};
            }
        });    
    }
    $scope.changeJobStatusConfirmed = (data) => {
        let selectedDate = data.selectedDate;
        let status = data.status;
        let addressId = data.addressId;
        let addressIndex = data.addressIndex;
        let routeId = data.routeId;
        let oneOfJobId = data.oneOfJobId;
        let parentIndex = data.parentIndex;
        $scope.changeJobStatusConfirmedAPI(selectedDate, status, addressId, addressIndex, routeId, oneOfJobId, parentIndex);
    }
    $scope.changeJobStatus = function(selectedDate, status, addressId, addressIndex, routeId, oneOfJobId, parentIndex=''){   
        if (status == 'Completed') {
            $scope.openChangeJobStatusConfirmation(selectedDate, status, addressId, addressIndex, routeId, oneOfJobId, parentIndex);
        } else {            
            $scope.changeJobStatusConfirmedAPI(selectedDate, status, addressId, addressIndex, routeId, oneOfJobId, parentIndex);        
        }
    }
    $scope.filterByStatus = function(node) {
        let type = node;
        $scope.jobStatus[type] = !$scope.jobStatus[type];        
        const index = $scope.selectedJobType.indexOf(type);
        if(index > -1) {
            $scope.selectedJobType.splice(index, 1)
        }else {
            $scope.selectedJobType.push(type);
        }                        
        $scope.selectedJobTypeCode = [];
        angular.forEach($scope.selectedJobType, function(item){
            if(item=='jobs'){
                $scope.selectedJobTypeCode.push(0);
            }
            if(item=='filter cleans'){
                $scope.selectedJobTypeCode.push(1);
            }
            if(item=='salt cell cleans'){
                $scope.selectedJobTypeCode.push(2);
            }
        })            
        $scope.getNotRoutedJobs('', true);
        // $scope.updateUnschedulePaneFilters(false);
    }
    $scope.daySelected = function(dayCount, resetFilter=true) {
        $rootScope.isHideAllRoute = false;
        $scope.clearTimeIntervalForGettingRoute();
        delayFactorFirst = 1;
        if($scope.googleMapArgs){
            const allRoutes = $rootScope.routes.flat();
            allRoutes.forEach(function(route){
                $scope.googleMapArgs.method.removeRoute(route.id);
            })
        }
        $rootScope.selectedAddressDetailModel = {};
        if(resetFilter){
            $rootScope.filters["TECHNICIAN"] = [];
        }
        var len = $rootScope.routes.length;
        for(let idx = 0; idx < len; idx++){
            if(idx >= dayCount){
                angular.forEach($rootScope.routes[idx], function(route){
                    if(!route.isHidden){
                        $scope.googleMapArgs.method.removeRoute(route.id);
                    }
                });                
                $rootScope.routes.splice(idx,1);
            }
        }
        var date = angular.copy($scope.selectedRouteDate); 
        $scope.activeDates = [];
        $rootScope.activeDates = [];
        if (!$scope.$$phase) $scope.$apply();
        for(let i = 0; i<dayCount; i++) {
            $scope.activeDates.push(new Date(moment(date).add(i, 'days')));
            $rootScope.activeDates.push(new Date(moment(date).add(i, 'days')));
        }
        $scope.activeDayCount = dayCount;
        auth.setStorage('activeDayCount', dayCount);
        $scope.showFilter(false);
        if (!$scope.$$phase) $scope.$apply();
    }
    $(document).on( "click", 'body', function(e){   
        var eleStatusBox = $('.eleStatusBox');
        if(!eleStatusBox.is(e.target) && eleStatusBox.has(e.target).length === 0 && Object.entries($scope.setBoxStatusPopup).length > 0){       
            $scope.setBoxStatusPopup = {}
            if (!$scope.$$phase) $scope.$apply()
        }
    });
    $rootScope.getNextOccuranceDate = (address, selectedDate) => {
        var title = '';
        if (address.weekFrequency && address.weekFrequency > 0) {
            let _selectedDate = selectedDate; 
            title = 'Scheduled for this date and job will appear in app.';            
            if(address && address.isAltWeekHide) { 
                title = 'Not scheduled for this date and job will not appear in app.';           
                var dateMatched = false;
                var index = 1;
                while(!dateMatched) {
                    var _t = moment(address.assignRouteDate).add(address.weekFrequency * index, 'weeks').format('YYYY-MM-DD');
                    index++;
                    if (_t > _selectedDate) {
                        dateMatched = true;
                        let nextOccuranceDate = _t;
                        if (address.endDate) {
                            let endDate = moment(address.endDate).format('YYYY-MM-DD');
                            if (moment(endDate).isBefore(nextOccuranceDate)) {
                                return title;
                            }
                        }
                        _t = moment(_t).format('MM/DD/YYYY');
                        return title + ' Next job will occur on ' + _t;
                    }                        
                }                
                return title;
            }
            if(address.movedFrom && address.movedDetail && address.movedDetail.length > 0 && address.movedDetail[2]) {
                _selectedDate = moment(address.movedDetail[2]).format('YYYY-MM-DD');
            }         
            let nextOccuranceDate = moment(_selectedDate).add(address.weekFrequency, 'weeks').format('YYYY-MM-DD');            
            if (address.endDate) {
                let endDate = moment(address.endDate).format('YYYY-MM-DD');
                if (moment(endDate).isBefore(nextOccuranceDate)) {
                    return title;
                }
            }
            if (nextOccuranceDate) {
                nextOccuranceDate = moment(nextOccuranceDate).format('MM/DD/YYYY');
                return title + ' Next job will occur on ' + nextOccuranceDate;
            } else {
                return title;
            }
        }
        return title;
    }
    $scope.openMoveErrorPopupPastDate = () => {
        $scope.moveErrorPopupPastDate = ngDialog.open({    
            name: 'moveErrorPastDate',
            template: 'moveErrorPastDate.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {
            }
        })
    }
    $scope.closeMoveErrorPopupPastDate = () => {
        if ($scope.moveErrorPopupPastDate) {
            $scope.moveErrorPopupPastDate.close()
        }
    }
    $rootScope.selectedDateForCheckBox = '';     
    $rootScope.updateCheckBoxStats = () => {
        $rootScope.selectedDateForCheckBox = '';
        setTimeout(function() {
            var _btn = document.querySelectorAll('[data-xid="moveBtn"][data-visible="true"]')
            let myArray = Array.from(_btn)
            var s = myArray[0] ? myArray[0].getAttribute('data-sdate') : '';
                $rootScope.selectedDateForCheckBox = s;                
                var _input = document.querySelectorAll('[data-xid="selectedDateForCheckBoxInput"]')
                _input.forEach(function(v, i){
                    if (s !== v.getAttribute('data-sdate')) {
                        v.checked = false
                    }
                })
        }, 1)
    }
    document.querySelector('body').addEventListener('click', function(){
        $rootScope.updateCheckBoxStats()
    })
    $rootScope.selectedFromTechIdforMoving = 0;
    $rootScope.selectedToTechIdforMoving = 0;
    $rootScope.setTechIDForMove = (type, id) => {
        if (type == 'from') {
            $rootScope.selectedFromTechIdforMoving = Number(id);            
        }
        if (type == 'to') {
            $rootScope.selectedToTechIdforMoving = Number(id);
        }
    }
    $scope.propertiesAlreadyMoved = false;
    $scope.propertiesAlreadyMovedData = [];
    $scope.sendResponseForCheckAlreadyMoved = (data) => {
        if (data.routeAlreadyMoved && data.routeAlreadyMoved.length > 0) {
            $scope.propertiesAlreadyMoved = true;
            $scope.propertiesAlreadyMovedData = data.routeAlreadyMoved;
            $scope.showAlreadyMovedPopup();
        } else {
            $scope.propertiesAlreadyMoved = false;
            $scope.propertiesAlreadyMovedData = [];
        }
    }                
    $scope.showAlreadyMovedPopup = () => {
        ngDialog.open({
            template: 'propertiesAlreadyMoved.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            closeByDocument: false,
            preCloseCallback: function () {
                $scope.propertiesAlreadyMoved = false;
                $scope.propertiesAlreadyMovedData = [];
            }
        });
    }
    $scope.endDatePassed = false;
    $scope.endDatePassedData = [];
    $scope.sendResponseForCheckEndDatePassed = (data) => {
        if (data.endDatePassed && data.endDatePassed.length > 0) {
            $scope.endDatePassed = true;
            $scope.endDatePassedData = data.endDatePassed;
            $scope.showEndDatePassedPopup();
        } else {
            $scope.endDatePassed = false;
            $scope.endDatePassedData = [];
        }
    }                
    $scope.showEndDatePassedPopup = () => {
        ngDialog.open({
            template: 'endDatePassed.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            closeByDocument: false,
            preCloseCallback: function () {
                $scope.endDatePassed = false;
                $scope.endDatePassedData = [];
            }
        });
    }
    $scope.routeSkipped = false;
    $scope.routeSkippedData = [];    
    $scope.sendResponseForCheckRouteSkipped = (data) => {
        if (data.routeSkipped && data.routeSkipped.length > 0) {
            $scope.routeSkipped = true;
            $scope.routeSkippedData = data.routeSkipped;
            $scope.showrouteSkippedPopup();
        } else {
            $scope.routeSkipped = false;
            $scope.routeSkippedData = [];
        }
    }
    $scope.showrouteSkippedPopup = () => {
        ngDialog.open({
            template: 'routeSkipped.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            closeByDocument: false,
            preCloseCallback: function () {
                $scope.routeSkipped = false;
                $scope.routeSkippedData = [];
            }
        });
    }
    $scope.updateDaysData = (arr) => {
        if (arr.length > 0) {            
            let isHidden = arr[arr.length-1].isHidden;
            delete arr[arr.length-1];
            arr.map((item)=>{
                if (!item.hasOwnProperty('isHidden')) {
                    item._days = item.days ? item.days : '';
                    delete item.days;
                    item.days = item.routeDays ? item.routeDays.split(',') : [];
                    item.isHidden = isHidden
                }
            })
        }
        return arr;
    }
    $scope.updatePrimaryAddressNode = (arr) => {
        if (arr && arr.length > 0) {
            arr.map((item)=>{
                if (item.hasOwnProperty('primaryAddressDetails') && !item.hasOwnProperty('primaryaddressId')) {
                    item.primaryAddressId = item.primaryAddressDetails.addressId
                    delete item.primaryAddressDetails
                }
            })
        }
        return arr
    }
    $scope.generateNonRoutedMarkers = function() {   
        $scope.googleMapArgs.method.setMultipleMark($scope.notRoutedAddressList.concat($scope.notRoutedJobList))
        setTimeout(function(){
            $scope.resetMapZoom()
        },1000)    
    }
    $scope.getClass = function(add){
        let isRouteStop = !add.oneOfJobId || add.oneOfJobId == 0;
        let isOneTimeJob = add.oneOfJobId && add.oneOfJobId > 0;
        let isNoAccessJob = add.isNoAccessJob && add.isNoAccessJob == 'No Access';
        let className = '';
        className = $scope.getJobStatusClasses(isRouteStop ? add.jobStatusWeb : (isOneTimeJob ? add.jobDetail.jobStatus : (isNoAccessJob ? 'No Access' : null))).progressBarClass;
        return className;
    }
    $scope.getAddBoxClass = function(address){
        var className = '';
        if(address.skipToday){
            className = 'skipped';
        }else if(address.isMoved){
            className = 'permanent-moved';
        }else if(address.isTemporary){
            className = 'temporary-moved';
        }else if(address.isOneOfJob == 1){
            className = 'one-job-route';
        }
        if(!address.latitude || !address.longitude){
            className = className + ' invalid-route-property';
        }
        return className;
    }
    // 
    $scope.allCustomerTags = [];
    $scope.getAllCustomerTags = function() {  
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
    $scope.searchTextTag = '';
    $scope.filteredTags = function() {
        $scope.searchTextTag = $(document).find('#customerTagSearchRoute').val();
        var filter = $scope.searchTextTag.trim().toUpperCase();
        return $scope.allCustomerTags.filter(function(tag) {            
            var tagUpperCase = tag.toUpperCase();            
            return tagUpperCase.indexOf(filter) !== -1 && ($scope.selectedCustomerTags && !$scope.selectedCustomerTags.includes(tag));
        });
    };
    $scope.isCustomerTagListShown = false;
    $scope.toggleCustomerTagList = function(type) {
        if (type == 'open') {
            $scope.isCustomerTagListShown = true;
        }
        if (type == 'close') {
            $scope.isCustomerTagListShown = false;
        }
    }
    $scope.selectedCustomerTags = [];
    $scope.addTagTofilter = function(tag) {
        let t = angular.copy($scope.selectedCustomerTags)
        $scope.selectedCustomerTags = [];
        if (!$scope.selectedCustomerTags.includes(tag)) {
            $scope.selectedCustomerTags = t;
            $scope.selectedCustomerTags.push(tag)
        }
        // $scope.toggleCustomerTagList('close');
        $scope.filterRouteResult('CUSTOMER_TAG', tag);
        $scope.searchTextTag = '';
    }
    $scope.removeTagFromFilter = function(tag) {
        $scope.selectedCustomerTags = $scope.selectedCustomerTags.filter(function(selectedTag) {
            return selectedTag !== tag;
        });        
        $scope.filterRouteResult('CUSTOMER_TAG', tag)
    }
    $scope.getAllCustomerTags();    
    $scope.isFilterApplyingToUnscheduleSection = false;
    $scope.toggleFilterApplyToUnscheduled = function(status) {
        $scope.isFilterApplyingToUnscheduleSection = status;
        $scope.updateJobFilterBtnDisabled();
        $scope.updateUnschedulePaneFilters(true);
    }
    $scope.noneRouteFilterTemplate = {
        id: 0,
        templateName: "None",
        techFilter: [],
        typeFilter: [],
        statusFilter: [],
        tags: [],
        isDefault: 0,
        appliedToUnscheduled: 0
    }
    $scope.selectedRouteFilterTemplate = $scope.noneRouteFilterTemplate;
    $scope.setSelecteRouteFilterTemplate = function(template, refreshData=true) {       
        $scope.selectedRouteFilterTemplate = template;
        if (template.techFilter && template.techFilter.length > 0) {
            $rootScope.filters["TECHNICIAN"] = template.techFilter;
        } else {
            $rootScope.filters["TECHNICIAN"] = []
        }
        if (template.typeFilter && template.typeFilter.length > 0) {
            $rootScope.filters["JOB_TYPE"] = template.typeFilter;
        } else {
            $rootScope.filters["JOB_TYPE"] = []
        }
        if (template.statusFilter && template.statusFilter.length > 0) {
            $rootScope.filters["JOB_STATUS"] = template.statusFilter;
        } else {
            $rootScope.filters["JOB_STATUS"] = []
        }     
        if (template.tagsFilter && template.tagsFilter.length > 0) {      
            $scope.renderTagsFromFilterTemplate(template.tagsFilter);            
        } else {
            $rootScope.filters["CUSTOMER_TAG"] = [];
            $scope.selectedCustomerTags = [];
        }             
        $scope.isFilterApplyingToUnscheduleSection = template.appliedToUnscheduled;
        $scope.updateUnschedulePaneFilters();        
        if (refreshData) {
            $scope.daySelected($scope.activeDayCount, false);            
            if ($scope.isFilterApplyingToUnscheduleSection) {
                $scope.toggleFilterApplyToUnscheduled(template.appliedToUnscheduled)
            }
        }
    }
    $scope.renderTagsFromFilterTemplate = function(tags) {
        $scope.selectedCustomerTags = [];
        if (tags && tags.length > 0) {
            tags.forEach(function(tag){
                $scope.selectedCustomerTags.push(tag);
                $rootScope.filters["CUSTOMER_TAG"] = $scope.selectedCustomerTags;
                // if ($scope.allCustomerTags.includes(tag)) {                    
                //     if ($scope.selectedCustomerTags.indexOf(tag) === -1) {
                //     }
                // }
            })
        }
        $rootScope.filters["CUSTOMER_TAG"] = $scope.selectedCustomerTags;
    }
    $scope.newRouteFilterTemplateNameModal = null;
    $scope.openNewRouteFilterTemplateForm = function() {
        $scope.newRouteFilterTemplateNameModal = ngDialog.open({            
            template: 'newRouteFilterTemplateNameModal.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {     
                $scope.saveFilterTemplateModel.templateName = '';
            }
        });
    }    
    $scope.deleteRouteFilterTemplateConfirmModal = null;
    $scope.confirmRouteFilterTemplateDelete = function() {
        $scope.deleteRouteFilterTemplateConfirmModal = ngDialog.open({            
            template: 'deleteRouteFilterTemplateConfirmModal.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {     
                
            }
        });
    }  
    $scope.defaultRouteFilterTemplateConfirmModal = null;
    $scope.defaultRouteFilterTemplateAction = null;
    $scope.confirmRouteFilterTemplateDefault = function(type) {
        $scope.defaultRouteFilterTemplateAction = type;
        $scope.defaultRouteFilterTemplateConfirmModal = ngDialog.open({            
            template: 'defaultRouteFilterTemplateConfirmModal.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {     
                $scope.defaultRouteFilterTemplateAction = null;
            }
        });
    }  
    $scope.saveFilterTemplateModel = {
        templateName: '',
    }
    $scope.routeTemplateFilterTemplateEndpoint = "/route_filter_template";
    $scope.routeTemplateFilterTemplatesFetching = true;
    $scope.routeTemplateFilterTemplatesUpdating = false;
    $scope.routeTemplateFilterTemplates = [];
    $scope.templateFilterSuccess = '';
    $scope.templateFilterError = '';
    $scope.getAllRouteFilterTemplates = function() {
        let payload = {
            getDefaultTemplate: false
        }
        apiGateWay.get($scope.routeTemplateFilterTemplateEndpoint, payload).then(function(response) {
            if (response.data.status == 200) {
                $scope.parseFitlerTemplates(response.data.data.Data, 'list');                                              
            }
            $scope.routeTemplateFilterTemplatesFetching = false;
        }, function(error){
            $scope.templateFilterError = 'Something went wrong. Unable to load filter templates.';
            $scope.routeTemplateFilterTemplatesFetching = false;
        })                 
    }
    $scope.checkTemplateNameExists = function(name) {
        return $scope.routeTemplateFilterTemplates.findIndex(template => template.templateName.toLowerCase() === name.toLowerCase()) !== -1        
      }
    $scope.createNewRouteFilterTemplate = function() {
        if (!$scope.saveFilterTemplateModel.templateName || $scope.saveFilterTemplateModel.templateName == '') {
            return
        }        
        if ($scope.checkTemplateNameExists($scope.saveFilterTemplateModel.templateName)) {
            $scope.templateFilterError = 'Template name already exist.';
            $timeout(() => { $scope.templateFilterError = ''; }, 2000)
            return
        }
        $scope.routeTemplateFilterTemplatesUpdating = true;
        let payload = {
            action: "add",
            templateName: $scope.saveFilterTemplateModel.templateName,
            techFilter: $scope.getFilterFromPage("TECHNICIAN"),
            typeFilter: $scope.getFilterFromPage("JOB_TYPE"),
            statusFilter: $scope.getFilterFromPage("JOB_STATUS"),
            tagsFilter: $scope.getFilterFromPage("CUSTOMER_TAG"),
            isDefault: 0,
            appliedToUnscheduled: $scope.isFilterApplyingToUnscheduleSection,
        }
        apiGateWay.send($scope.routeTemplateFilterTemplateEndpoint, payload).then(function(response) {
            if (response.data.status == 200) {
                if (response.data.message == 'Route Filters Already exist!') {
                    $scope.templateFilterError = 'Route Filters Already exist: ' + response.data.data['Template name'];
                    $timeout(()=>{$scope.templateFilterError=''},2000);
                    $scope.routeTemplateFilterTemplatesUpdating = false;
                    return
                }
                let templateRecieved = response.data.data.Data || [];
                $scope.parseFitlerTemplates(templateRecieved, 'add')
                $scope.newRouteFilterTemplateNameModal.close();
            } else {
                $scope.templateFilterError = response.data.message;
                $timeout(()=>{$scope.templateFilterError=''},2000);
            }
            $scope.routeTemplateFilterTemplatesUpdating = false;
        }, function(error){
            $scope.templateFilterError = typeof error == 'string' ? error : 'Something went wrong.';
            $timeout(()=>{$scope.templateFilterError=''},2000);
            $scope.routeTemplateFilterTemplatesUpdating = false;
        })
    }
    $scope.deleteRouteFilterTemplate = function() {                
        $scope.routeTemplateFilterTemplatesUpdating = true;
        let payload = {
            action: "delete",
            templateId: $scope.selectedRouteFilterTemplate.id            
        }
        apiGateWay.send($scope.routeTemplateFilterTemplateEndpoint, payload).then(function(response) {
            if (response.data.status == 200) {
                if ($scope.selectedRouteFilterTemplate.isDefault) {
                    auth.deleteStorage('defaultRouteFilterTemplateSession');
                }
                let templateRecieved = response.data.data.Data || [];
                $scope.parseFitlerTemplates(templateRecieved, 'delete')
                $scope.deleteRouteFilterTemplateConfirmModal.close();                  
            }
            $scope.routeTemplateFilterTemplatesUpdating = false;
        }, function(error){
            $scope.templateFilterError = typeof error == 'string' ? error : 'Something went wrong.';
            $timeout(()=>{$scope.templateFilterError=''},2000);
            $scope.routeTemplateFilterTemplatesUpdating = false;
        })    
    }
    $scope.changeDefaultRouteFilterTemplate = function() { 
        $scope.selectedRouteFilterTemplate.isDefault = $scope.defaultRouteFilterTemplateAction == 'set' ? 1 : 0;
        $scope.routeTemplateFilterTemplatesUpdating = true;
        let payload = {
            action: "update",
            templateId: $scope.selectedRouteFilterTemplate.id,
            isDefault: $scope.selectedRouteFilterTemplate.isDefault
        }
        if (payload.templateId == 0 && payload.isDefault == 1) {
            let defaultTemplate = $scope.routeTemplateFilterTemplates.find(template => template.isDefault === 1);
            auth.setStorage('defaultRouteFilterTemplateSession', $scope.selectedRouteFilterTemplate);
            if (defaultTemplate) {
                payload.templateId = defaultTemplate.id;
                payload.isDefault = 0;
            } else {
                auth.deleteStorage('defaultRouteFilterTemplateSession');
                $scope.routeTemplateFilterTemplatesUpdating = false; 
                $scope.defaultRouteFilterTemplateConfirmModal.close();
                return
            }
        }
        apiGateWay.send($scope.routeTemplateFilterTemplateEndpoint, payload).then(function(response) {
            if (response.data.status == 200) {
                auth.deleteStorage('defaultRouteFilterTemplateSession');
                if (payload.isDefault) {
                    auth.setStorage('defaultRouteFilterTemplateSession', $scope.selectedRouteFilterTemplate)
                }
                let templateRecieved = response.data.data.Data || [];
                $scope.parseFitlerTemplates(templateRecieved, 'update')
                $scope.defaultRouteFilterTemplateConfirmModal.close();              
            }
            $scope.routeTemplateFilterTemplatesUpdating = false;
        }, function(error){
            $scope.templateFilterError = typeof error == 'string' ? error : 'Something went wrong.';
            $timeout(()=>{$scope.templateFilterError=''},2000);
            $scope.routeTemplateFilterTemplatesUpdating = false;
        })    
    }
    $scope.noRouteFilterSelected = function() {
        let filters = $rootScope.filters;
        return (filters.TECHNICIAN.length == 0 && filters.JOB_TYPE.length == 0 && filters.JOB_STATUS.length == 0 && (filters.CUSTOMER_TAG && filters.CUSTOMER_TAG.length == 0))
    }
    $scope.getFilterFromPage = function(type) {
        let filters = [];
        if (type == 'TECHNICIAN') { 
            filters = $rootScope.filters["TECHNICIAN"];
            filters.sort((a, b) => a - b);
        }
        if (type == 'JOB_TYPE') { 
            filters = $rootScope.filters["JOB_TYPE"];
            filters.sort((a, b) => a - b);
        }
        if (type == 'JOB_STATUS') { 
            filters = $rootScope.filters["JOB_STATUS"];
            filters.sort((a, b) => a - b);
        }
        if (type == 'CUSTOMER_TAG') { 
            filters = $rootScope.filters["CUSTOMER_TAG"];
            filters.sort((a, b) => a.localeCompare(b));
        }
        return filters
    }
    $scope.parseFitlerTemplates = function(data, action) {
        $scope.routeTemplateFilterTemplates = [];
        if (data && data.constructor === Array) {
            if (data.length > 0) {                
                data.forEach(function(responseTemplate){
                    let template = {
                        id: responseTemplate.id,
                        templateName: responseTemplate.templateName,
                        techFilter: responseTemplate.techFilter,
                        typeFilter: responseTemplate.typeFilter,
                        statusFilter: responseTemplate.statusFilter,
                        tagsFilter: responseTemplate.tagsFilter,
                        isDefault: responseTemplate.isDefault,
                        appliedToUnscheduled: responseTemplate.appliedToUnscheduled,
                        techFilterData: responseTemplate.techFilterData
                    }
                    $scope.routeTemplateFilterTemplates.push(template)
                })
            }
            if (action == 'add') {
                let template = $scope.getLatestCreatedTemplate();
                $scope.setSelecteRouteFilterTemplate(template, false);
            } 
            if (action == 'delete') {
                $scope.setSelecteRouteFilterTemplate($scope.noneRouteFilterTemplate);
            }
        }     
    }
    $scope.getLatestCreatedTemplate = function() {
        let data = angular.copy($scope.routeTemplateFilterTemplates)
        data = data.sort((a, b) => b.id - a.id);
        const latestTemplate = data[0];
        return latestTemplate;
    }
    $scope.getJobTypeIds = function(key) {
        let ids = [
            {
                key: 'routeStops',
                filter_label: 'Route Stops',
                unschedule_label: 'Route Stops',
                filter_id: 0,
                unschedule_id: null
            },
            {
                key: 'oneTimeJob',
                filter_label: 'One Time Jobs',
                unschedule_label: 'Jobs',
                filter_id: 1,
                unschedule_id: 0
            },
            {
                key: 'filterClean',
                filter_label: 'Filter Cleans',
                unschedule_label: 'Filter Cleans',
                filter_id: 2,
                unschedule_id: 1
            },
            {
                key: 'saltCellClean',
                filter_label: 'Salt Cell Cleans',
                unschedule_label: 'Salt Cell Cleans',
                filter_id: 3,
                unschedule_id: 2
            }
        ];
        return ids.find(obj => obj.key === key);
    }
    $scope.getDefaultTemplateSelectedStatus = function() {
        let selected = false;
        let defaultTemplate = $scope.routeTemplateFilterTemplates.find(template => template.isDefault === 1);
        if (defaultTemplate && defaultTemplate.id != 0) {
            selected = true;
        }
        return selected;
    }
    $scope.getAllRouteFilterTemplates();    
    if ($rootScope.defaultRouteFilterTemplate) {
        $scope.setSelecteRouteFilterTemplate($rootScope.defaultRouteFilterTemplate, false)
    }   
    $scope.isTechnicianAlreadyShowing = function(route) {
        if ($rootScope.routesFilterList) {
            return $rootScope.routesFilterList.techList.findIndex((obj) => obj.techId === route.techId)
        } else {
            return -1
        }
    }
});