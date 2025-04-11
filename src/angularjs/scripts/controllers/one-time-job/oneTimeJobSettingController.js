angular.module('POOLAGENCY').controller('oneTimeJobSettingController', function($rootScope, $scope,$window, Carousel, deviceDetector, $timeout, $filter, $sce, apiGateWay, service, $state, $stateParams, ngDialog, Analytics, configConstant, auth) {
    $scope.jobId = $stateParams.jobId;
    $scope.scheduleTime = [];
    $scope.customTemplate = [];
    
    $scope.customTemplateId = '';
    $scope.bundleSearchForm = false;
    $scope.successMail = "";
    $scope.saveJobSettingData = { 'startTime':'','endTime': '','period': '','id':''};
    //$scope.scheduleNewRow = false;
    $scope.startTimePickerOption = {format: 'hh:mm A'};
    $scope.endTimePickerOption = {format: 'hh:mm A'};
    $scope.systemTempate = [];
    $scope.systemTempateId = '';
    $scope.durationOption = {format: 'HH:mm', showClear: false};

    $scope.oneTimeJobSetting = function() {
        $rootScope.$watch('oneTimeJobSettingData',function(newVal, oldVal){
            if(newVal){
                $scope.scheduleTime = $rootScope.oneTimeJobSettingData.scheduleTime; 
                angular.forEach($scope.scheduleTime, (element, index) => {
                    if(element.startTime && !element.startTime.includes('/')){
                    
                    $scope.scheduleTime[index].startTime = moment("12/12/2012 "+element.startTime, 'DD/MM/YYYY hh:mm A').format("MM/DD/YYYY HH:mm");
                    }
                    if(element.endTime && !element.endTime.includes('/')){
                    
                    $scope.scheduleTime[index].endTime = moment("12/12/2012 "+element.endTime, 'DD/MM/YYYY hh:mm A').format("MM/DD/YYYY HH:mm");
                    }            
                });
            }
        });
    }

    $scope.addScheduleNewRow = function() {
        $scope.saveJobSettingData = { 'startTime':'2014-02-27T00:00:00','endTime': '2014-02-27T00:00:00','period': '','id':'', 'startTimeClass': 'newRow1', 'endTimeClass': 'newRow2'};
        $scope.scheduleTime.push($scope.saveJobSettingData);
        //$scope.scheduleNewRow = true;
    }

    $scope.removeScheduleNewRow = function() {
        $scope.scheduleNewRow = false;
    }

    $scope.removeTimeWindow = function(scheduleData, index){
        if(scheduleData.id!=''){
            $rootScope.settingPageLoaders.jobScheduleSection = true;
            apiGateWay.send("/delete_one_job_setting", {
                "id": scheduleData.id
            }).then(function(response) {
                if (response.data.status == 200) {
                    $scope.scheduleTime.splice( index, 1);
                    if ($scope.scheduleTime.length === 0){
                        $scope.scheduleTime = [];
                    }
                }
                $rootScope.settingPageLoaders.jobScheduleSection = false;
                // $scope.isProcessing = false;/
            }, function(error){
                $scope.isProcessing = false;
                $rootScope.settingPageLoaders.jobScheduleSection = false;
            })
        }else{
            $scope.scheduleTime.splice( index, 1);
            if ($scope.scheduleTime.length === 0){
                $scope.scheduleTime = [];
            }
        }
        
    }

    //Delete Discount
  $scope.removeTemplateConfirm = function(customTemplateId, index){
    $scope.customTemplateId = customTemplateId;
    $scope.index = index;
    ngDialog.open({
        template: 'removeTemplateConfirmPopup.html',
        className: 'ngdialog-theme-default',
        scope: $scope,
    });
  }

    $scope.removeTemplate = function(customTemplateId, index){
        $rootScope.settingPageLoaders.jobScheduleSection = true;
        apiGateWay.send("/delete_template", {
            "id": customTemplateId.id
        }).then(function(response) {
            if (response.data.status == 200) {
                $scope.customTemplate.splice( index, 1);
                if ($scope.customTemplate.length === 0){
                    $scope.customTemplate = [];
                }                
                ngDialog.close();
            }
            $rootScope.settingPageLoaders.jobScheduleSection = false;
        }, function(error){
            $scope.isProcessing = false;
            $rootScope.settingPageLoaders.jobScheduleSection = false;
        })
        
   }
  
   $scope.removeClass = function(){
       alert($(this));
   }
  
   $scope.focusDatePicker = function(scheduleData,index,type) { 
        if(type==='start') {
            $scope.scheduleTime[index].startTimeClass = '';
            if(!scheduleData.startTime) {
                var m = moment();
                m = m.set({hour:0,minute:0,second:0,millisecond:0})
                $scope.scheduleTime[index].startTime = m
            }
        }
        if(type==='end') {
            $scope.scheduleTime[index].endTimeClass = '';
            if(!scheduleData.endTime) {
                var m = moment();
                m = m.set({hour:0,minute:0,second:0,millisecond:0})
                $scope.scheduleTime[index].endTime = m
            } 
        }
   }
   $scope.timeWindowTimeout;
   $scope.clearTimeWindowTimeout = () => {    
        clearInterval($scope.timeWindowTimeout)
   }
   $scope.saveOneTimeJobSetting = function(scheduleData,index) {    
        clearInterval($scope.timeWindowTimeout);
        $scope.timeWindowTimeout = setTimeout(function() {                
        var startTimeSelected = endTimeSelected = false;
        if (scheduleData.startTime && scheduleData.startTime._i) {
            var startTimeStr = scheduleData.startTime._i;
            startTimeSelected = startTimeStr.substr(startTimeStr.length - 8) !== '00:00:00'; 
        }
        if (scheduleData.endTime && scheduleData.endTime._i) {
            var endTimeStr = scheduleData.endTime._i;
            endTimeSelected = endTimeStr.substr(endTimeStr.length - 8) !== '00:00:00';         
        }
        if(!scheduleData.period){
            return
        }
        let endTime = "";
        let startTime = "";
        
        if(scheduleData.endTime && endTimeSelected){
            endTime = moment(scheduleData.endTime).format('hh:mm A');
        } 
        if(scheduleData.startTime && startTimeSelected){
            startTime = moment(scheduleData.startTime).format('hh:mm A');
        }    
       
        let saveOneTimeJobSettingData = {
            "startTime":startTime,
            "endTime": endTime,
            "period": scheduleData.period,
            "id":scheduleData.id
        };
        $rootScope.settingPageLoaders.jobScheduleSection = true;
        apiGateWay.send("/one_job_setting", saveOneTimeJobSettingData).then(function(response) {
            if (response.data.status == 201) {
                $scope.scheduleNewRow = false;

                $scope.scheduleTime[index].id = response.data.data.OneOffJobSettingId;
                //$scope.oneTimeJobSetting();   
                $scope.successMail = response.data.message; 
                setTimeout(function() {
                    $scope.successMail = "";
                }, 2000); 
                $scope.saveJobSettingData = { 'class': 'nwRow'};      
            } else {
                $scope.errorProductForm = 'Error';
                setTimeout(function() {
                    $scope.errorProductForm = "";
                }, 2000);
            }
            $rootScope.settingPageLoaders.jobScheduleSection = false;
        },function(error) {    
            $rootScope.settingPageLoaders.jobScheduleSection = false;        
            $scope.isProcessing = false;
            $scope.errorProductForm = error;
            setTimeout(function() {
                $scope.errorProductForm = "";
            }, 2000);
        });
       }, 700)  
    }
});