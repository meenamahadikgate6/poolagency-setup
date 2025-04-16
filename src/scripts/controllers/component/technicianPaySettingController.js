angular.module('POOLAGENCY')

.controller('technicianPaySettingController', function($rootScope, $scope, apiGateWay, ngDialog, service, $state, $stateParams,$timeout, auth) {   
    $scope.canView = auth.getSession().viewTechnicianPay ? auth.getSession().viewTechnicianPay : 0;
    $scope.selectedTechnicianRole = {};
    $scope.serviceLevelDefaultModel = [];  
    $scope.techPayServiceLevels = [];    
    $scope.techPayServiceLevelsDefault = [];
    $scope.techRoleModel = [];
    $scope.selectedTechPayServiceLevelIndex = 0;
    $scope.techPayNoAccess = {}
    $scope.techPayNoAccessDefault = {}
    $scope.coveredRouteStopBonus = {}
    $scope.coveredRouteStopBonusDefault = {}
    $scope.isTechRolesExist = true;    

    $scope.$on("$destroy", function () {
      $rootScope.getTechRole = null;
    })
    $scope.openAddTechRolePopup = function(type=''){ 
      
      $scope.type = 'Edit'  
      if(type == 'Edit'){
        angular.forEach($scope.techRoleModel, function(item, index){
          if($scope.techRoleModel[index].id == $scope.selectedTechnicianRole.id){
            $scope.techRole = item.role;    
            $scope.updateTabScroll();        
          }
        })
      } else {
        $scope.type = 'Add'
      }
      ngDialog.open({
        id  : 10,
        template: 'addTechRole.html',
        className: 'ngdialog-theme-default v-center',
        overlay: true,
        closeByNavigation: true,
        scope: $scope,
        preCloseCallback: function() {    
          $scope.techRole = ''
          $scope.type = '';
        }
      });
     
    }

    $scope.openDuplicateTechRolePopup = function(){ 
      angular.forEach($scope.techRoleModel, function(item, index){
        if($scope.techRoleModel[index].id == $scope.selectedTechnicianRole.id){
          $scope.techRole = item.role+ ' (copy)';    
          $scope.updateTabScroll();        
        }
      })
      ngDialog.open({
        id  : 10,
        template: 'duplicateTechRole.html',
        className: 'ngdialog-theme-default v-center',
        overlay: true,
        closeByNavigation: true,
        scope: $scope,
        preCloseCallback: function() {    
          $scope.techRole = ''
          $scope.type = '';
        }
      });
     
    }

    $scope.addTechRole = function(role){
      var postData = {
        id:$scope.type == 'Add' ? '' : $scope.selectedTechnicianRole.id,
        role:angular.copy(role)
      }
      $rootScope.settingPageLoaders.technicianPaySection = true;
      apiGateWay.send("/tech_role", postData).then(function(response) {
        if (response.data.status == 201) {
          if($scope.type == 'Edit'){           
           $scope.selectedTechnicianRole = angular.copy(postData);
           angular.forEach($scope.techRoleModel, function(item, index){
            if($scope.techRoleModel[index].id == postData.id){
              $scope.techRoleModel[index] = angular.copy(postData)   
              $scope.updateTabScroll();          
            }
           })
          } else {           
            
            $scope.techRoleModel.push(response.data.data);
            $scope.selectedTechnicianRole = angular.copy(response.data.data);
            $scope.getTechPayByRole(response.data.data);          
            if (!$scope.$$phase) $scope.$apply()
            $scope.updateTabScroll();
          }
          $scope.techPaySuccess = response.data.message; 
          ngDialog.closeAll();
          $scope.isTechRolesExist = true;
        } else {
          $scope.techPayError = response.data.message;
        }     
        setTimeout(function(){
          $scope.techPaySuccess = '';
          $scope.techPayError = '';
          if (!$scope.$$phase) $scope.$apply()
          $scope.updateTabScroll();
        }, 2000);
        $rootScope.settingPageLoaders.technicianPaySection = false;
      }, function(error){
        $rootScope.settingPageLoaders.technicianPaySection = false;
        $scope.techPayError = error;  
        setTimeout(function(){
          $scope.techPayError = '';
          if (!$scope.$$phase) $scope.$apply()
        }, 2000);
      })
    }

    $scope.duplicateTechRole = false;
    $scope.addDuplicateTechRole = function(selectedRole) {
      obj = {
        id : $scope.selectedTechnicianRole.id,
        role: selectedRole
      }
      $rootScope.settingPageLoaders.technicianPaySection = true;
      apiGateWay.send("/tech_role_clone", obj).then(function(response) {
        if (response.data.status == 200) { 
          $scope.successDuplicateAlert = response.data.message;
          $scope.duplicateTechRole = true;
          $rootScope.getTechRole(selectedRole);         
        } else {
          $scope.duplicateTechRole = false;
          $rootScope.getTechRole(selectedRole);
        }     
        setTimeout(function(){
          $scope.successDuplicateAlert = '';
          if (!$scope.$$phase) $scope.$apply()
          ngDialog.closeAll();
          $scope.updateTabScroll();
        }, 2000);
      }, function(error){
        $scope.duplicateTechRole = false;
        $scope.errorDuplicateAlert = error;
        $rootScope.getTechRole(selectedRole);
        setTimeout(function(){
          $scope.errorDuplicateAlert = '';
          // ngDialog.closeAll();
          if (!$scope.$$phase) $scope.$apply()
        }, 2000);
      })
    }
    $scope.sortRolesAlphabetically = function(roles) { 
      return roles.sort((a, b) => {
          const roleA = a.role.toLowerCase();
          const roleB = b.role.toLowerCase();    
          if (roleA < roleB) return -1;
          if (roleA > roleB) return 1;
          return 0;
      });
    }
    $rootScope.getTechRole = function(){   
      $rootScope.settingPageLoaders.technicianPaySection = true;   
      apiGateWay.get("/tech_role", {}).then(function(response) {
        if (response.data.status == 200) {
          if(response.data.data.length > 0){
            $scope.techRoleModel = angular.copy(response.data.data);
            $scope.techRoleModel = $scope.sortRolesAlphabetically($scope.techRoleModel);
            $scope.duplicateIndex = $scope.techRoleModel.length-1;
            $scope.selectedTechnicianRole = $scope.duplicateTechRole ? $scope.techRoleModel[$scope.duplicateIndex] : $scope.techRoleModel[0];
            $scope.getTechPayByRole($scope.selectedTechnicianRole);
            $scope.updateTabScroll();
          } else {
            $scope.techRoleModel = [];
          }
          $scope.isTechRolesExist = response.data.data.length > 0 ? true : false;
           
        } else {
          $scope.techPayError = response.data.message;
        }  
        $rootScope.settingPageLoaders.technicianPaySection = false;   
        setTimeout(function(){
          $scope.techPayError = '';
          if (!$scope.$$phase) $scope.$apply()
          $scope.updateTabScroll();
        }, 2000);
      }, function(error){
        $rootScope.settingPageLoaders.technicianPaySection = false;
        $scope.techPayError = error;  
        setTimeout(function(){
          $scope.techPayError = '';
          if (!$scope.$$phase) $scope.$apply()
        }, 2000);
      })
    }
    
    $scope.getTechPayByRole = function(role={id:0}){  
      if(role && role.id){
        $rootScope.settingPageLoaders.technicianPaySection = true;
        $scope.selectedTechnicianRole = role;
        $scope.getTechcomPayFJobs(role.id);
        $scope.getTechcomPayFSales(role.id);
        $scope.getTechcomPayFJobsItems(role.id);
        $scope.getTechcomPayFSalesItems(role.id);
        apiGateWay.get("/tech_pay", {roleId:role.id}).then(function(response) {
          if (response.data.status == 200) {              
              let sLevel = $rootScope.sortServiceLevel(response.data.data.serviceLevel, 'techPay')              
              $scope.techPayServiceLevels = angular.copy(sLevel);
              $scope.techPayServiceLevelsDefault = angular.copy(sLevel);
              $scope.techPayNoAccess = angular.copy(response.data.data.noAccess);
              $scope.techPayNoAccessDefault = angular.copy(response.data.data.noAccess);
              $scope.coveredRouteStopBonus = angular.copy(response.data.data.coveredRouteStopBonus);
              $scope.coveredRouteStopBonusDefault = angular.copy(response.data.data.coveredRouteStopBonus);
              $scope.setZeroForNull($scope.techPayServiceLevels);
              

              $scope.techPaySettingDropdownChange(0)
              $scope.updateTabScroll();

          } else {
            $scope.techPayError = response.data.message;
          }     
          setTimeout(function(){
            $scope.techPayError = '';
            if (!$scope.$$phase) $scope.$apply()
            $rootScope.settingPageLoaders.technicianPaySection = false;
            $scope.updateTabScroll();
          }, 2000);
        }, function(error){
          $rootScope.settingPageLoaders.technicianPaySection = false;
          $scope.techPayError = error;  
          setTimeout(function(){
            $scope.techPayError = '';
            if (!$scope.$$phase) $scope.$apply()
          }, 2000);
        })
      }
    }
    $scope.setZeroForNull = function(level){
      angular.forEach(level, function(item, parentIndex){
        angular.forEach(item.poolType, function(data, index){
          if(!$scope.techPayServiceLevels[parentIndex].poolType[index].rate){
            $scope.techPayServiceLevels[parentIndex].poolType[index].rate = 0;
            $scope.updateTabScroll();
          }
          if(!$scope.techPayServiceLevelsDefault[parentIndex].poolType[index].rate){
            $scope.techPayServiceLevelsDefault[parentIndex].poolType[index].rate = 0;
            $scope.updateTabScroll();
          }        
        })
      })
      if(!$scope.techPayNoAccess || ($scope.techPayNoAccess && !$scope.techPayNoAccess.rate)){
        $scope.techPayNoAccess.rate = 0;
        $scope.updateTabScroll();
      }
      if(!$scope.techPayNoAccessDefault || ($scope.techPayNoAccessDefault && !$scope.techPayNoAccessDefault.rate)){
        $scope.techPayNoAccessDefault.rate = 0;
        $scope.updateTabScroll();
      } 
      if(!$scope.coveredRouteStopBonus || ($scope.coveredRouteStopBonus && !$scope.coveredRouteStopBonus.rate)){
        $scope.coveredRouteStopBonus.rate = 0;
        $scope.updateTabScroll();
      }
      if(!$scope.coveredRouteStopBonusDefault || ($scope.coveredRouteStopBonusDefault && !$scope.coveredRouteStopBonusDefault.rate)){
        $scope.coveredRouteStopBonusDefault.rate = 0;
        $scope.updateTabScroll();
      }  
  
    }
    $scope.techPaySettingDropdownChange = function(index){
        $scope.selectedTechPayServiceLevelIndex = index;
    }
    $scope.coveredRouteStopBonusError = '';
    $scope.removeErrorClass = function(id) {
      let targetElement = document.getElementById(id)
      if (targetElement) {
        targetElement.classList.remove('has-error')
      }
    }
    $scope.addErrorClass = function(id) {
      let targetElement = document.getElementById(id)
      if (targetElement) {
        targetElement.classList.add('has-error')
      }
    }
    $scope.updateTechRates = function(index, type){ 
      if (type == 'coveredRouteStopBonus') {
        if($scope.coveredRouteStopBonus.rate == $scope.coveredRouteStopBonusDefault.rate){ return false; }        
        $scope.coveredRouteStopBonus.rate =  $scope.coveredRouteStopBonus.rate + '';
        $scope.coveredRouteStopBonus.rate = $scope.coveredRouteStopBonus.rate.replace(/\$|,/g, '');
        let rate = angular.copy($scope.coveredRouteStopBonus.rate);
        rate = Number(rate);        
        if (rate < 0 || rate > 100) {
          let errorMsg = 'Covered route stop bonus can not be ' + (rate < 0 ? 'less then 0%' : 'greater than 100%');          
          $scope.coveredRouteStopBonusError = errorMsg;      
          $scope.addErrorClass('coveredRouteStopBonus');
          $timeout(()=>{ $scope.coveredRouteStopBonusError = ''; }, 2000)
          return
        }        
      } else if(type == 'noAccess'){        
        if($scope.techPayNoAccess.rate == $scope.techPayNoAccessDefault.rate){ return false; }        
        $scope.techPayNoAccess.rate =  $scope.techPayNoAccess.rate.toString(); //reverse masking 
        $scope.techPayNoAccess.rate = $scope.techPayNoAccess.rate.replace(/\$|,/g, ''); //reverse masking 
      } else {
        $scope.techPayServiceLevels[$scope.selectedTechPayServiceLevelIndex].poolType[index].rate = Number($scope.techPayServiceLevels[$scope.selectedTechPayServiceLevelIndex].poolType[index].rate).toFixed(2)
        if($scope.techPayServiceLevels[$scope.selectedTechPayServiceLevelIndex].poolType[index].rate == $scope.techPayServiceLevelsDefault[$scope.selectedTechPayServiceLevelIndex].poolType[index].rate){ return false; } 
        $scope.techPayServiceLevels[$scope.selectedTechPayServiceLevelIndex].poolType[index].rate =  $scope.techPayServiceLevels[$scope.selectedTechPayServiceLevelIndex].poolType[index].rate.toString(); //reverse masking 
        $scope.techPayServiceLevels[$scope.selectedTechPayServiceLevelIndex].poolType[index].rate = $scope.techPayServiceLevels[$scope.selectedTechPayServiceLevelIndex].poolType[index].rate.replace(/\$|,/g, ''); //reverse masking 
      }

     
      let postData = {
        "roleId": $scope.selectedTechnicianRole.id,
        "serviceLevelId":$scope.techPayServiceLevels[$scope.selectedTechPayServiceLevelIndex].id,
        "poolTypes": $scope.techPayServiceLevels[$scope.selectedTechPayServiceLevelIndex].poolType,
        "noAccess": $scope.techPayNoAccess ? $scope.techPayNoAccess : {},
        "coveredRouteStopBonus": $scope.coveredRouteStopBonus ? $scope.coveredRouteStopBonus : {}
      } 
      $rootScope.settingPageLoaders.technicianPaySection = true;
        apiGateWay.send("/tech_pay", postData).then(function(response) {
          if (response.data.status == 200) {
            $scope.techPayServiceLevels[$scope.selectedTechPayServiceLevelIndex].poolType = angular.copy(response.data.data.poolType);
            $scope.techPayServiceLevelsDefault[$scope.selectedTechPayServiceLevelIndex].poolType = angular.copy(response.data.data.poolType);            
            $scope.techPayNoAccess = angular.copy(response.data.data.noAccess);
            $scope.techPayNoAccessDefault = angular.copy(response.data.data.noAccess);
            $scope.coveredRouteStopBonus = angular.copy(response.data.data.coveredRouteStopBonus);
            $scope.coveredRouteStopBonusDefault = angular.copy(response.data.data.coveredRouteStopBonus);
            $scope.setZeroForNull($scope.techPayServiceLevels);
            $scope.updateTabScroll();
          } else {
            $scope.techPayError = response.data.message;
          }     
          setTimeout(function(){
            $scope.techPayError = '';
            if (!$scope.$$phase) $scope.$apply()
            $scope.updateTabScroll();
          }, 2000);
          $rootScope.settingPageLoaders.technicianPaySection = false;
        }, function(error){
          $rootScope.settingPageLoaders.technicianPaySection = false;
          $scope.techPayError = error;  
          setTimeout(function(){
            $scope.techPayError = '';
            if (!$scope.$$phase) $scope.$apply()
          }, 2000);
          
        })
     
     
    }

    $scope.techRoleDeleteConfirm = function(){      
      ngDialog.open({
          template: 'removeTechRoleConfirm.html',
          className: 'ngdialog-theme-default v-center',
          overlay: true,
          closeByNavigation: true,
          scope: $scope,
          preCloseCallback: function () {   
            $scope.index = '';    
          }
      });
    } 
    $scope.techRoleDeleteAction = function(){
      apiGateWay.send('/delete_tech_role', {id: $scope.selectedTechnicianRole.id}).then(function(response) {  
        if (response.data.status == 201) {   
          $rootScope.getTechRole();
          ngDialog.closeAll()
        } else {
          $scope.techPayError = response.data.message;
        }  
        
      }, function(error) {          
        $scope.techPayError = error;
      });    
    }

    
//scroll tab
$scope.scrollServiceLevelTab = '';
$scope.scrollServiceLevelTab = function (direction){
  
    var speed=25,distance=100,step=10;
    var element = document.querySelectorAll('.service-tab-new')[0];
    var scrollAmount = 0;
    var slideTimer = setInterval(function(){
        if(direction == 'left'){
            element.scrollLeft -= step;
        } else {
            element.scrollLeft += step;
        }
        scrollAmount += step;
        if(scrollAmount >= distance){
            window.clearInterval(slideTimer);
        }
    }, speed);
}
var tabUpdateIntervalIns = '';  
    $scope.updateTabScroll = function(){
    tabUpdateIntervalIns = setTimeout(function(){ 
        $scope.tabContainerWidth = 0;
        var ele = document.querySelectorAll('#serviceTab4')[0];
        for (var i = 0; i < angular.element(ele).children().length; i++) {
        $scope.tabContainerWidth += angular.element(ele).children()[i].clientWidth;
        }        
        $scope.tabContainerWidth += 1;   
        if(window.innerWidth > 1920) {
          $scope.tabContainerWidth += 7;   
        }
        $scope.$apply();
    }, 100)     
}
$scope.$watch('chemicalReadingServiceArray', function (newVal, oldVal) {    
  if(newVal){
    $scope.updateTabScroll();
  }            
}, true);
$scope.clearTabUpdateInterval = function(){
    if(tabUpdateIntervalIns){clearTimeout(tabUpdateIntervalIns);}
}
$scope.selectTab = function(tabIndex, force=false){
    if($scope.selectedWaterBody !== tabIndex || force){
        $scope.selectedWaterBody = tabIndex;
        $scope.updateTabScroll(); 
        $scope.getChecklistByWaterBodyId($scope.waterBodies[tabIndex].id)
        $scope.getGallonsByWaterBodyId($scope.waterBodies[tabIndex].id)
        if (angular.isDefined($rootScope.getEquipmentDetails) && angular.isFunction($rootScope.getEquipmentDetails)) {$rootScope.getEquipmentDetails($scope.waterBodies[tabIndex]);}            
        if (angular.isDefined($rootScope.getJobDetailByWaterBody) && angular.isFunction($rootScope.getJobDetailByWaterBody)) {$rootScope.getJobDetailByWaterBody($scope.waterBodies[tabIndex]);}
    }       
}
//scroll tab end 
$scope.techcommissionpayFJobs = {
  prodPrcntJobSales: 0,
  serPrcntJobSales: 0
}
$scope.getTechcomPayFJobs = function(roleId) {
  apiGateWay.get("/techcommissionpay/jobs", {roleId:roleId}).then(function(response) {
    if (response.status == "200") { 
      if(!response.data.data){
        $scope.techcommissionpayFJobs.prodPrcntJobSales = 0;
        $scope.techcommissionpayFJobs.serPrcntJobSales = 0;
      }
      else{
        techcomPayFJob = response.data.data;
        $scope.techcommissionpayFJobs.prodPrcntJobSales = techcomPayFJob.productPercentage;
        $scope.techcommissionpayFJobs.serPrcntJobSales = techcomPayFJob.servicePercentage;
      }
    }
  }, function(error){
    $scope.commissionFJobsError = error;  
    setTimeout(function(){
      $scope.commissionFJobsError = '';
      if (!$scope.$$phase) $scope.$apply()
    }, 2000);
  });
}

$scope.updateCommissionFJobs = function(techcommissionpayFJobs){
  $rootScope.settingPageLoaders.technicianPaySection = true;
  apiGateWay.send("/techcommissionpay/jobs", {roleId:$scope.selectedTechnicianRole.id,productPercentage:techcommissionpayFJobs.prodPrcntJobSales ? techcommissionpayFJobs.prodPrcntJobSales : 0,servicePercentage:techcommissionpayFJobs.serPrcntJobSales ? techcommissionpayFJobs.serPrcntJobSales : 0}).then(function(response) {
    if (response.data.status == '200') { 
      techcommissionpayFJobs = response.data.data;
      $scope.techcommissionpayFJobs.prodPrcntJobSales = techcommissionpayFJobs.productPercentage;
      $scope.techcommissionpayFJobs.serPrcntJobSales = techcommissionpayFJobs.servicePercentage;
    }
    $rootScope.settingPageLoaders.technicianPaySection = false;
  }, function(error){
    $rootScope.settingPageLoaders.technicianPaySection = false;
    $scope.commissionFJobsError = error;  
    setTimeout(function(){
      $scope.commissionFJobsError = '';
      if (!$scope.$$phase) $scope.$apply()
    }, 2000);
  });
}

$scope.techcommissionpayFSales = {
  prodPrcntJobSales: 0,
  serPrcntJobSales: 0
}

$scope.productBundleListNewFJ = [];

$scope.$on('productAddEvent', function(event, data) {
  if (data && data.widgetArea == 'techPayJob') {    
      if (data.isClose) {
        $scope.isBundleSearchFJ = false;
        $scope.bundleSearchFormFJ = false;               
        return
      }    
      $scope.addProductToBundleFJ(data);
  } else if (data && data.widgetArea == 'techPaySale') {    
    if (data.isClose) {
      $scope.isBundleSearchFS = false;
      $scope.bundleSearchFormFS = false;              
      return
    }    
    $scope.addProductToBundleFS(data);
}
});
$scope.addProductToBundleFJ = (product) => {
  let bundleObj =
  {
      "roleId": $scope.selectedTechnicianRole.id,
      "itemId": product.itemId ? product.itemId : product.id,
      "itemPercentage": product.itemPercentage ? product.itemPercentage : 0,
  }
  apiGateWay.send("/techcommissionpay/jobitems", bundleObj).then(function(response) {
    if (response.status == 200) { 
      $scope.productNoItemFJ = false;
      $scope.productNoItemFJStyle = {
        "position" : 'relative',
        "top": "0"
      }
      if(product.name){
        $scope.productBundleListNewFJ.push(response.data.data);
      }
      else {
        product.itemPercentage = response.data.data.itemPercentage;
      }
      $scope.bundleSearchText = '';
      $scope.isBundleSearchFJ = false;
      $scope.bundleSearchFormFJ = false;
    }
  }, function(error){
    $scope.commissionFJobsError = error;  
    setTimeout(function(){
      $scope.commissionFJobsError = '';
      if (!$scope.$$phase) $scope.$apply()
    }, 2000);
  });
};

$scope.productNoItemFJ = false;
$scope.getTechcomPayFJobsItems = function(roleId) {
  apiGateWay.get("/techcommissionpay/jobitems", {roleId:roleId}).then(function(response) {
    if (response.status == "200") { 
      techcomPayFSales = response.data.data;
      $scope.productBundleListNewFJ = techcomPayFSales;
      $scope.productNoItemFJ = false;
      $scope.productNoItemFJStyle = {
        "position" : 'relative',
        "top": "0"
      }
      if($scope.productBundleListNewFJ.length == 0) {
        $scope.productNoItemFJStyle = {
          "position" : 'relative',
          "top": "-105"
        }
        $scope.productNoItemFJ = true;
      }
    }
  }, function(error){
    $scope.commissionFJobsError = error;  
    setTimeout(function(){
      $scope.commissionFJobsError = '';
      if (!$scope.$$phase) $scope.$apply()
    }, 2000);
  });
}
$scope.productBundleListNewFS = [];
$scope.addProductToBundleFS = (product) => {
  let bundleObj = {
      "roleId": $scope.selectedTechnicianRole.id,
      "itemId": product.itemId ? product.itemId : product.id,
      "itemPercentage": product.itemPercentage ? product.itemPercentage : 0
  }
  apiGateWay.send("/techcommissionpay/saleitems", bundleObj).then(function(response) {
    if (response.status == 200) { 
      $scope.productNoItemFS = false;
      $scope.productNoItemFSStyle = {
        "position" : 'relative',
        "top": "0"
      }
      if(product.name){
        $scope.productBundleListNewFS.push(response.data.data);
      }
      else {
        product.itemPercentage = response.data.data.itemPercentage;
      }
      $scope.bundleSearchText = '';
      $scope.isBundleSearchFS = false;
      $scope.bundleSearchFormFS = false;
    }
  }, function(error){
    $scope.commissionFSalesError = error;  
    setTimeout(function(){
      $scope.commissionFSalesError = '';
      if (!$scope.$$phase) $scope.$apply()
    }, 2000);
  });
};

$scope.addBundleProductSearchFJ = () => {
  $scope.bundleSearchFormFJ = true;
  // $scope.isBundleSearchFJ = true;
  setTimeout(function(){
      angular.element("#bundleSearchText").focus();
  }, 100);    
}

$scope.addBundleProductSearchFS = () => {
  $scope.bundleSearchFormFS = true;
  // $scope.isBundleSearchFS = true;
  setTimeout(function(){
    angular.element("#bundleSearchText").focus();
  }, 100);    
}

$scope.hideSearchBarFJ = function () {
  if (!$scope.searchText) {
    $scope.bundleSearchFormFJ = false;
    $scope.isBundleSearchFJ = false;
  }
  $scope.searchText = "";
}

$scope.hideSearchBarIconFJ = function () {
  $scope.bundleSearchFormFJ = false;
  $scope.isBundleSearchFJ = false;
  $scope.searchText = ""
}

$scope.hideSearchBarFS = function () {
  if (!$scope.searchText) {
    $scope.bundleSearchFormFS = false;
    $scope.isBundleSearchFS = false;
  }
  $scope.searchText = "";
}

$scope.hideSearchBarIconFS = function () {
  $scope.bundleSearchFormFS = false;
  $scope.isBundleSearchFS = false;
  $scope.searchText = ""
}

// $scope.showListForBundle = (searchText,techType) => {
//   let bundleSearchList= [];
//   $scope.searchText = searchText;
//   if(searchText.length>0){
//     apiGateWay.get("/product_services", {
//               offset: 0,
//               limit: 5,
//               sortOrder: 'asc',
//               sortColumn: 'name',
//               category: 'Product-Service',
//               status: 1,
//               name: searchText,
//               roleId: $scope.selectedTechnicianRole.id,
//               techType: techType
//             }).then(function(response) {
//               if (response.data.status == 200) {
//                 bundleSearchList = response.data.data.data;
//                 if(techType == 'job'){
//                     $scope.isBundleSearchFJ = true;
//                     $scope.productBundleListFJ = bundleSearchList;
//                   }
//                   else {
//                     $scope.isBundleSearchFS = true;
//                     $scope.productBundleListFS = bundleSearchList;
//                   }
//               } else {
//                   $scope.isBundleSearchFJ = false;
//                   $scope.isBundleSearchFS = false;
//                   $scope.productBundleList = [];
//                 }
//               $rootScope.settingPageLoaders.technicianPaySection = false;
//           });
//       }else{
//           $scope.productBundleList = [];
//           $scope.isBundleSearchFJ = false;
//           $scope.isBundleSearchFS = false;
//       }
//   }

  $scope.removeProductToBundle = function(product,index,type){ 
    if ($scope.productBundleListNewFJ.length > -1){
      if(type == 'job'){
        $scope.productBundleListNewFJ.splice( index, 1);
        if($scope.productBundleListNewFJ.length == 0){
          $scope.productNoItemFJStyle = {
            "position" : 'relative',
            "top": "-105"
          }
          $scope.productNoItemFJ = true;
        }
      }
      else {
        $scope.productBundleListNewFS.splice( index, 1);
        if($scope.productBundleListNewFS.length == 0){
          $scope.productNoItemFSStyle = {
            "position" : 'relative',
            "top": "-105"
          }
          $scope.productNoItemFS = true;
        } 
      }
        apiGateWay.send("/remove_tech_commission_item", {roleId:product.roleId,itemId:product.itemId,type:type}).then(function(response) {
          if (response.status == "200") { 
          }
        }, function(error){
          $scope.commissionFJobsError = error;  
          setTimeout(function(){
            $scope.commissionFJobsError = '';
            if (!$scope.$$phase) $scope.$apply()
          }, 2000);
        });
     }
}

$scope.getTechcomPayFSales = function(roleId) {
  apiGateWay.get("/techcommissionpay/sales", {roleId:roleId}).then(function(response) {
    if (response.status == "200") { 
      if(!response.data.data){
        $scope.techcommissionpayFSales.prodPrcntJobSales = 0;
        $scope.techcommissionpayFSales.serPrcntJobSales = 0;
      }
      else{
        techcomPayFSales = response.data.data;
        $scope.techcommissionpayFSales.prodPrcntJobSales = techcomPayFSales.productPercentage;
        $scope.techcommissionpayFSales.serPrcntJobSales = techcomPayFSales.servicePercentage;
      }
    }
  }, function(error){
    $scope.commissionFSalesError = error;  
    setTimeout(function(){
      $scope.commissionFSalesError = '';
      if (!$scope.$$phase) $scope.$apply()
    }, 2000);
  });
}

$scope.productNoItemFS = false;
$scope.getTechcomPayFSalesItems = function(roleId) {
  apiGateWay.get("/techcommissionpay/saleitems", {roleId:roleId}).then(function(response) {
    if (response.status == "200") { 
      techcomPayFSales = response.data.data;
      $scope.productBundleListNewFS = techcomPayFSales;
      $scope.productNoItemFS = false;
      $scope.productNoItemFSStyle = {
        "position" : 'relative',
        "top": "0"
      }
      if($scope.productBundleListNewFS.length == 0) {
        $scope.productNoItemFSStyle = {
          "position" : 'relative',
          "top": "-105"
        }
        $scope.productNoItemFS = true;
      }
    }
  }, function(error){
    $scope.commissionFSalesError = error;  
    setTimeout(function(){
      $scope.commissionFSalesError = '';
      if (!$scope.$$phase) $scope.$apply()
    }, 2000);
  });
}

$scope.updateCommissionFSales = function(techcommissionpayFSales){
  $rootScope.settingPageLoaders.technicianPaySection = true;
  apiGateWay.send("/techcommissionpay/sales", {roleId:$scope.selectedTechnicianRole.id,productPercentage:techcommissionpayFSales.prodPrcntJobSales ? techcommissionpayFSales.prodPrcntJobSales : 0,servicePercentage:techcommissionpayFSales.serPrcntJobSales ? techcommissionpayFSales.serPrcntJobSales : 0}).then(function(response) {
    if(response.data.status == '200'){
      techcommissionpayFSales = response.data.data;
      $scope.techcommissionpayFSales.prodPrcntJobSales = techcommissionpayFSales.productPercentage;
      $scope.techcommissionpayFSales.serPrcntJobSales = techcommissionpayFSales.servicePercentage
    }
    $rootScope.settingPageLoaders.technicianPaySection = false;
  }, function(error){
    $scope.commissionFSalesError = error;  
    $rootScope.settingPageLoaders.technicianPaySection = false;
    setTimeout(function(){
      $scope.commissionFSalesError = '';
      if (!$scope.$$phase) $scope.$apply()
    }, 2000);
  });
}
  $scope.disableTab = (e) => {
    if ($rootScope.settingPageLoaders.technicianPaySection) {
      e.preventDefault()
    }
  }
});
