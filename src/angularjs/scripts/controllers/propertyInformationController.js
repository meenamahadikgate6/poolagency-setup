angular.module('POOLAGENCY')

.controller('propertyInformationController', function($rootScope, $scope, apiGateWay, ngDialog, service, $state, $stateParams,$timeout, auth) {
    var userSession = auth.getSession()
    $scope.companyId = userSession.companyId;
    $scope.userId = userSession.userId;
    $scope.addressId = $stateParams.addressId;
    $scope.propertyItems = [];
    $scope.propertyItemsData = [];
    $scope.propertyItemsEntry = [];   
    $scope.availablePropertyItemID = [];   
    $scope.imageInitialIndex = 999;    
    $scope.crossClicked = false;   
    $scope.isApiProcessing = false;
    $scope.showDogNameField = false;
    /*get propertyItem Details*/
    $rootScope.getPropertyItemDetails = function() {             
        $scope.propertyItems = [
            {
                label:'Gate Code',
                slug: 'gateCode',
                value: $rootScope.custAddrDetailsData.gateCode ? angular.copy($rootScope.custAddrDetailsData.gateCode): '',
                status: $rootScope.custAddrDetailsData.gateCode ? 'YES' : 'NO'
            },
            {   
                label:'Access Notes',
                slug: 'accessNotes',
                value: $rootScope.custAddrDetailsData.accessNotes ? angular.copy($rootScope.custAddrDetailsData.accessNotes) : '',
                status: $rootScope.custAddrDetailsData.accessNotes ? 'YES' : 'NO'
            },
            {
                label:'Dogs',
                slug: 'hasDogs',                
                value: $rootScope.custAddrDetailsData.hasDogs ? angular.copy($rootScope.custAddrDetailsData.hasDogs) : '',
                isDog: $rootScope.custAddrDetailsData.hasDogs ? true : false,
                status: $rootScope.custAddrDetailsData.hasDogs ? 'YES' : 'NO'
            }          
          ]
          angular.forEach($scope.propertyItems, function(item) {  
            //if(item.detail.isPresent == 1 || item.detail.isPresent == undefined){
                $scope.availablePropertyItemID.push(item.slug);
            //} 
         });
    };  
    $scope.onArrowKeyEvent = function() {
        document.onkeydown = function (e) {
            var ele = document.getElementsByClassName("propertyItem-detail-popup");
            if(!$scope.isProcessing && !$scope.isApiProcessing && ele.length > 0 ){
                if(e.target.nodeName == "TEXTAREA" ) return;    
                if(e.target.nodeName == "INPUT" &&  e.target.type == "text") return;              
                var openDialog = ngDialog.getOpenDialogs();
                if(openDialog.length > 1) return;
                switch (e.key) {
                    case 'ArrowUp':
                        // up arrow
                        break;
                    case 'ArrowDown':
                        // down arrow
                        break;
                    case 'ArrowLeft':
                    $timeout(function(){
                        $scope.showPropertyItemDetail($scope.propertyItemPrev)         
                    }, 100)
                        
                        break;
                    case 'ArrowRight':
                    $timeout(function(){
                        $scope.showPropertyItemDetail($scope.propertyItemNext)      
                    }, 100)                       
                }
            }
        };
    }
    
    
    /*Show propertyItem Detail*/      
    $scope.showPropertyItemDetail = function(value) { 
        
        $scope.selectedPropertyItem = $scope.propertyItems.filter(eitem => eitem.slug == value);     
        $timeout(function(){
            var ele = document.getElementsByClassName("arrow");
            if(ele[0]){
                ele[0].focus()
            }              
        }, 100)
       
        $scope.onArrowKeyEvent();   
       
        ngDialog.closeAll()
        $scope.propertyItemType = value;
      
            $scope.model = {
                slug : $scope.selectedPropertyItem[0].slug,
                value: $scope.selectedPropertyItem[0].value == 'true' ? '' : $scope.selectedPropertyItem[0].value,    
                isDog: $scope.selectedPropertyItem[0].isDog   
            };     
            $scope.showDogNameField = $scope.selectedPropertyItem[0].value && $scope.selectedPropertyItem[0].slug == 'hasDogs' ? true : false;
           
        $scope.tempValue = $scope.selectedPropertyItem[0].value;
        $scope.tempIsDog = $scope.selectedPropertyItem[0].isDog;
        
        $scope.propertyItemNext = '';
        $scope.propertyItemPrev = '';
        if($scope.availablePropertyItemID.indexOf(value) > -1){
        angular.forEach($scope.availablePropertyItemID, function(item, index){            
            if(item == value){
                if(!$scope.availablePropertyItemID[index+1]){
                    $scope.propertyItemNext = $scope.availablePropertyItemID[0];                    
                } else {
                    $scope.propertyItemNext = $scope.availablePropertyItemID[index+1];
                }
                if(!$scope.availablePropertyItemID[index-1]){
                    $scope.propertyItemPrev = $scope.availablePropertyItemID[$scope.availablePropertyItemID.length-1];                
                } else {
                    $scope.propertyItemPrev = $scope.availablePropertyItemID[index-1];
                }
        
            }
        })
        ngDialog.open({
            id  : 10,
            template: 'propertyItemDetails.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {     
                $scope.model = {};     
                $timeout(function(){
                    $scope.getPropertyItemDetails();          
                }, 100)
                
            }
        });
    }

    };
    /*$scope.focusOnInvalidInput= function(isValid) {      
        if (!isValid) {         
            angular.element('input.ng-invalid').first().focus();
        } else {
            if($scope.photos.length == 0 || $scope.errorImage){   
                $scope.focusOnImageError();
            }
        }           
    };*/
    
   /*$scope.confirmBeforeSave = function(id){
        if(!$scope.model.typeId && !$scope.model.eqDetailId){           
            
            $scope.saveDataForUnknownAlert();            
        } else if(!$scope.model.typeId && ($scope.model.notes || $scope.model.eqImage.length > 0)){
            $scope.saveDataConfirm();
        } else {
            $scope.savePropertyItemDetail(id, $scope.model)
        }

   }*/
    $scope.focusOnImageError = function(){
        $timeout(function(){
            var divElem = document.getElementsByClassName('detail-box')[0];
            var chElem = document.getElementById('imageError');
            var topPos = divElem.offsetTop;
            divElem.scrollTop = chElem.offsetTop - topPos;
        }, 100)
       
    } 
    
    $scope.savePropertyItemDetail = function(model){   
     
        
        
        var postData = {            
            "addressId":$scope.addressId,
            "data":model.slug,
            "value": model.value
        }
        if(model.slug == 'hasDogs' && model.isDog && !model.value){
            postData.value = 'true';
        }
        if(!postData.data){
            $scope.error = 'Something went wrong, Please try again';
            setTimeout(function() {                
                $scope.error = '';                          
                // ngDialog.closeAll();
                if (!$scope.$$phase) $scope.$apply()                
            }, 2000);
            return false;
        }
        $scope.isApiProcessing = false;
        
        apiGateWay.send("/manage_add_details", postData).then(function(response) {  
            if (response.data.status == 200) {
                $scope.successMsg = response.data.message; 
                $rootScope.custAddrDetailsData[response.data.data.data]  =  response.data.data.value; 
                $scope.selectedPropertyItem[0].value = response.data.data.value;
                $scope.tempValue = response.data.data.value;
                $scope.tempIsDog = angular.copy($scope.model.isDog);
                $scope.getPropertyItemDetails();                
            } else {
                $scope.successMsg = '';
                $scope.error = response.data.message;
            }
            $scope.isApiProcessing = false;
            setTimeout(function() {                
                $scope.error = '';
                $scope.successMsg = '';              
                $scope.isProcessing = false;                
                // ngDialog.closeAll();
                if (!$scope.$$phase) $scope.$apply()                
            }, 1000);
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
            $scope.isApiProcessing = false;
            setTimeout(function() {
                $scope.error = '';
                if (!$scope.$$phase) $scope.$apply()
            }, 1000);
        });
   
      }
   
    $scope.onChangeRadio = function(e, eqId){
       
        if($scope.model.isDog == true){
            $scope.showDogNameField = true;
        } else {
            $scope.showDogNameField = false;
        }
        $scope.saveData($scope.model)       
    
    }  
    $scope.saveData = function(){
        if($scope.model.value !== $scope.tempValue ) {
            $scope.savePropertyItemDetail($scope.model)
        } 
        if($scope.model.slug == 'hasDogs' && $scope.model.isDog !== $scope.tempIsDog  ) {
            if($scope.model.isDog == false){
                $scope.model.value = '';
            }
            $scope.savePropertyItemDetail($scope.model)
        } 
    }
    $scope.eraseDataConfirm = function() {
        ngDialog.open({
          template: 'eraseDataConfirm.html',
          className: 'ngdialog-theme-default',
          scope: $scope,          
      });     
    };
   
  
    $scope.eraseData = function(){
        var postData = {            
            "addressId":$scope.addressId,
            "data": $scope.model.slug,
            "value":''
        }
        $scope.isProcessing = true;
        apiGateWay.send("/manage_add_details", postData).then(function(response) {  
            if (response.data.status == 200) {
                $scope.successMsg = response.data.message; 
                $rootScope.custAddrDetailsData[response.data.data.data]  =  response.data.data.value; 
                $scope.getPropertyItemDetails();                
            } else {
                $scope.successMsg = '';
                $scope.error = response.data.message;
            }
            $scope.isApiProcessing = false;
            setTimeout(function() {                
                //$scope.selectedPropertyItem =  $scope.propertyItems.filter(eitem => eitem.eqId == propertyItemSlug); 
                $scope.error = '';
                $scope.successMsg = '';              
                $scope.isProcessing = false;                
                 ngDialog.closeAll();
                if (!$scope.$$phase) $scope.$apply()                
            }, 1000);
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
            $scope.isApiProcessing = false;
            setTimeout(function() {
                $scope.error = '';
                if (!$scope.$$phase) $scope.$apply()
            }, 1000);
        });
    }
   
    
});
