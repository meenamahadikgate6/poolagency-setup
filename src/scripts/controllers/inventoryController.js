angular.module('POOLAGENCY').controller('inventoryController', function($rootScope, $scope, $state, auth, $timeout, apiGateWay, ngDialog, AwsS3Utility, AwsConfigService, configConstant) { 
    $scope.locationDetailFetching = false;
    $scope.totalPage = 0;
    $scope.totalRecord = 0;
    $scope.totalItems = 0;
    $scope.limit = 20;
    $scope.currentPage = 1;
    $scope.isEditing = false;
    $scope.model = null;
    $scope.transformedLocation = [];
    $scope.transformedTruck = [];
    $scope.parentSelected = null;
    $scope.permissions = {};
    $scope.isProcessing = false;
    $scope.selectedItem = null;
    $scope.locationList = [];
    $scope.truckList = [];
    $scope.isLanding = true;
    $scope.locationDetailFetching = true;
    $scope.selectedItemDetails = null;
    $scope.IsVisibleCityState = false;
    $scope.selected = null;
    $scope.tempPath = '';
    $scope.successMessage = '';
    $scope.errorMessage = '';
    $scope.selectedEvn = configConstant.currEnvironment;
    $scope.env = configConstant[$scope.selectedEvn];
    $scope.sortColumn = "name",
    $scope.sortOrder = "asc";
    $scope.globalSearchText = '';
    $scope.selectedSearchText = '';
    $scope.awsCDNpath = '';
    $scope.locationImageAwsPath = $scope.env.awsAssetsPrefix + $scope.env.awsAssetsPathInventoryLocation + $rootScope.userSession.companyId+'/';
    $scope.itemsImageAwsPath = $scope.env.awsAssetsPrefix + $scope.env.awsAssetsPathInventoryItems + $rootScope.userSession.companyId+'/';
    $scope.inventoryViewType = 'tile';
    $scope.inventorySidebarType = 'inventory';
    $scope.inventoryImageProcessing = {};
    $scope.imageIndex = 0;
    $scope.isShowSearchWidget = false;
    $scope.isGlobalSearching = false;
    $scope.isChildPopOpen = false;
    $scope.childModel = null;
    $scope.moveType = null;
    $scope.isFirstInitLoc = true;
    $scope.isFirstInitTruck = true;
    $scope.page = 1;
    $scope.allLocationList = [];
    $scope.allTruckList = [];
    $scope.moveItemModel = {
        quantity: 0,
        qtytomove: 0,
        remaining: 0
    };
    $scope.quantityData = {
        items: 0,
        totalQty: 0,
        totalValue: 0,
        sublocationsCount: 0
    };
    $scope.itemModel = {
        "name": '',
        "cost": null,
        "images": [],
        "itemType": "",
    };
    $scope.quantityDataCache = {};
    if (auth.getSession()) {
        $scope.permissions = auth.getSession();
        if ($scope.permissions.canAccessInventoryURL == 0) {
            $state.go("app.dashboard", {});
        }
    }
    $scope.initS3Config = function() {
        AwsConfigService.fetchAwsConfig().then(function(config) {
            $scope.awsCDNpath = config.domain;
        });
    }
    $timeout(function(){
        $scope.initS3Config();
    }, 2000);
    $scope.getListPayload = {
        name: '',
        sortBy: '',
        sortOrder: '',
        page: 1,
        limit: 20
    };
    $scope.locationModel =  {
        "name": "",
        "images": []
    };
    $scope.goToLanding = function() {
        $scope.isLanding = true;
        $scope.selectedSearchText = '';
        $scope.currentPage = $scope.showingFrom = $scope.page = 1;
        $scope.totalItems = $scope.totalCount = $scope.totalPage = 1;
        $scope.deselectAll($scope.inventorySidebarType == 'inventory' ? $scope.allLocationList : $scope.allTruckList);
        if ($scope.inventorySidebarType == 'inventory' && $scope.allLocationList.length > 0) {
            $scope.allLocationList[0].selected = true;
        }
        $scope.selectedItemDetails = null;
        $scope.quantityReset();
        $scope.selectedItem = $scope.getSelectedItem($scope.inventorySidebarType == 'inventory' ? $scope.allLocationList : $scope.allTruckList);
        $scope.selectedPath = $scope.getSelectedPath($scope.inventorySidebarType == 'inventory' ? $scope.allLocationList : $scope.allTruckList);
        if (!$scope.isFirstInitLoc && !$scope.isFirstInitTruck) {
            $scope.locationDetailFetching = true;
            $scope.fetchData();
        }
    }
    $scope.deselectAll = function (items) {
        if ($scope.inventorySidebarType == 'inventory') {
            if (items && items.length > 0) {
                angular.forEach(items, function (location) {
                    location.selected = false;
                    if (location.sublocations && location.sublocations.length > 0) {
                        $scope.deselectAll(location.sublocations);
                    }
                });
            }
        } else {
            if (items && items.length > 0) {
                angular.forEach(items, function (location) {
                    location.selected = false;
                });
            }
        }
    };
    $scope.clickMe = function (item, isSelectedItem = false) {
        if (item.id == 0) {
            $scope.goToLanding();
        } else {
            $scope.isLanding = false;
            $scope.deselectAll($scope.allTruckList);
            $scope.deselectAll($scope.allLocationList);
            $scope.selectedItemDetails = null;
            if (isSelectedItem) {
                let newSelected = $scope.filterSelected($scope.inventorySidebarType == 'inventory' ? $scope.allLocationList[0].sublocations : $scope.allTruckList, item);
                if (newSelected) {
                    newSelected.selected = true;
                    newSelected.isCollapsed = false;
                    item = newSelected;
                }
                $scope.getSelected();
            } else {
                item.selected = true;
                item.isCollapsed = false;
                $scope.getSelected();
            }
            if ($scope.inventorySidebarType == 'inventory') {
                $scope.getLocationDetail(item);
            } else {
                $scope.getTruckDetail(item);
            }
        }
    }
    $scope.getSelected = function() {
        $scope.selectedItem = $scope.getSelectedItem($scope.inventorySidebarType == 'inventory' ? $scope.allLocationList[0].sublocations : $scope.allTruckList);
        $scope.selectedPath = $scope.getSelectedPath($scope.inventorySidebarType == 'inventory' ? $scope.allLocationList[0].sublocations : $scope.allTruckList);
        $scope.selectedPathStr = ($scope.selectedPath ? $scope.selectedPath.join(" > ") : null);
    }
    $scope.filterSelected = function (items, item) {
        if ($scope.inventorySidebarType == 'inventory') {
            for (let location of items) {
                if (location.id == item.id) {
                    return location;
                }
                if (location.sublocations && location.sublocations.length > 0) {
                    let found = $scope.filterSelected(location.sublocations, item);
                    if (found) return found;
                }
            }
            return null;
        } else {
            for (let location of items) {
                if (location.id == item.id) {
                    return location;
                }
            }
            return null;
        }
    };
    $scope.getSelectedItem = function (items) {
        if ($scope.inventorySidebarType == 'inventory') {
            for (let location of items) {
                if (location.selected) {
                    return angular.copy(location);
                }
                if (location.sublocations && location.sublocations.length > 0) {
                    let found = $scope.getSelectedItem(location.sublocations);
                    if (found) return found;
                }
            }
            return null;
        } else {
            for (let location of items) {
                if (location.selected) {
                    return location;
                }
            }
            return null;
        }
    };
    $scope.getSelectedPath = function (items, path = []) {
        if ($scope.inventorySidebarType == 'inventory') {
            for (let location of items) {
                let newPath = [...path, location];
                if (location.selected) {
                    return newPath;
                }
                if (location.sublocations && location.sublocations.length > 0) {
                    let foundPath = $scope.getSelectedPath(location.sublocations, newPath);
                    if (foundPath) return foundPath;
                }
            }
            return null;
        } else {
            for (let truck of items) {
                let newPath = [...path, truck];
                if (truck.selected) {
                    return newPath;
                }
            }
            return null;
        }
    };
    $scope.sidebarToggled = false;
    $scope.toggleSidebar = function() {
        $scope.sidebarToggled = !$scope.sidebarToggled;
    }
    $scope.updateQtyPopup = null;
    $scope.openUpdateQtyPopup = function(){
        $scope.selectedItemDetails.qtyDelta = 0;
        $scope.selectedItemDetails.newQty = angular.copy($scope.selectedItemDetails.qty);
        $scope.isChildPopOpen = true;
        $scope.errorMessage = $scope.successMessage = null;
        $scope.updateQtyPopup = ngDialog.open({
            template: 'templates/inventory/updateQtyPopup.html?ver=' + $rootScope.PB_WEB_VERSION,
            className: 'ngdialog-theme-default v-center',
            scope: $scope,
            closeByDocument: true,
            trapFocus: false,
            preCloseCallback: function() {
                $scope.isChildPopOpen = false;
            }
        })
    };
    $scope.validateDelta = function() {
        if ($scope.selectedItemDetails.qtyDelta == null || $scope.selectedItemDetails.qtyDelta == undefined || isNaN($scope.selectedItemDetails.qtyDelta)) {
            $scope.selectedItemDetails.qtyDelta = 0
        }
    }
    $scope.updateQtyDelta = function(source) {
        if (source == 'qtyDelta') {
            let newQty = Number($scope.selectedItemDetails.qty) + Number($scope.selectedItemDetails.qtyDelta);
            $scope.selectedItemDetails.newQty = parseFloat(newQty.toFixed(4));
        }
        if (source == 'newQty') {
            if ($scope.selectedItemDetails.newQty == null || $scope.selectedItemDetails.newQty == '') {
                $scope.selectedItemDetails.qtyDelta = null;
            } else {
                let qtyDelta = Number($scope.selectedItemDetails.newQty) - Number($scope.selectedItemDetails.qty);
                $scope.selectedItemDetails.qtyDelta = parseFloat(qtyDelta.toFixed(4));
            }
        }
        if (source == 'decrement') {
            $scope.selectedItemDetails.qtyDelta = $scope.selectedItemDetails.qtyDelta - 1;
            $scope.selectedItemDetails.qtyDelta = parseFloat($scope.selectedItemDetails.qtyDelta.toFixed(4))
            $scope.updateQtyDelta('qtyDelta');
        }
        if (source == 'increment') {
            $scope.selectedItemDetails.qtyDelta = $scope.selectedItemDetails.qtyDelta + 1;
            $scope.selectedItemDetails.qtyDelta = parseFloat($scope.selectedItemDetails.qtyDelta.toFixed(4))
            $scope.updateQtyDelta('qtyDelta');
        }
    }
    
    $scope.sanitizeDeltaValue = function() {
        $scope.selectedItemDetails.qtyDelta = $scope.selectedItemDetails.qtyDelta + '';
        $scope.selectedItemDetails.qtyDelta = $scope.selectedItemDetails.qtyDelta.replace(/^([-+]?[0-9]*\.?[0-9]{0,2}).*$/, '$1');
        $scope.selectedItemDetails.qtyDelta = Number($scope.selectedItemDetails.qtyDelta);
        $scope.updateQtyDelta('qtyDelta');
    };
    $scope.sanitizeNewQty = function() {
        $scope.selectedItemDetails.newQty = $scope.selectedItemDetails.newQty + '';
        $scope.selectedItemDetails.newQty = $scope.selectedItemDetails.newQty.replace(/^([-+]?[0-9]*\.?[0-9]{0,2}).*$/, '$1');
        $scope.selectedItemDetails.newQty = Number($scope.selectedItemDetails.newQty);
        $scope.updateQtyDelta('newQty');
    };
    $scope.showItemDetails = function(data) {
        $scope.selectedItemDetails = $scope.prepareAndDisplayImages(data);
        $scope.openItemDetailPopup();   
    }
    $scope.itemDetailPopup = null;
    $scope.openItemDetailPopup = function(){
        $scope.model = angular.copy($scope.selectedItemDetails);
        $scope.isChildPopOpen = false;
        if ($scope.model.price) {
            $scope.model.price = $rootScope.currencyTrimmer($scope.model.price);
        }
        $scope.errorMessage = $scope.successMessage = null;
        $scope.itemDetailPopup = ngDialog.open({
            template: 'templates/inventory/itemDetailPopup.html?ver=' + $rootScope.PB_WEB_VERSION,
            className: 'ngdialog-theme-default v-center',
            scope: $scope,
            closeByDocument: true,
            preCloseCallback: function() {
                $scope.isChildPopOpen = false;
            }
        })
    };  
    $scope.moveItemPopup = null;
    $scope.openMoveItemPopup = function(){
        if ($scope.selectedItemDetails) {
            $scope.childModel = angular.copy($scope.moveItemModel);
            $scope.childModel.quantity = $scope.selectedItemDetails.qty;
            $scope.childModel.qtytomove = '';
            $scope.childModel.remaining = $scope.selectedItemDetails.qty;
        }
        $scope.moveType = ($scope.inventorySidebarType == 'inventory') ? 'location' : 'truck';
        $scope.isChildPopOpen = true;
        $scope.moveItemPopup = ngDialog.open({
            template: 'templates/inventory/moveItemPopup.html?ver=' + $rootScope.PB_WEB_VERSION,
            className: 'ngdialog-theme-default v-center',
            scope: $scope,
            closeByDocument: true,
            trapFocus: false,
            preCloseCallback: function() {
                $scope.selectedmoveItems = null;
                $scope.isChildPopOpen = false;
                $scope.childModel = null;
                $scope.moveType = null;
            }
        })
    };   
    $scope.addItemPopup = null;
    $scope.openAddItemPopup = function(){
        $scope.model = angular.copy($scope.itemModel);
        $scope.isShowSearchWidget = true;
        if ($scope.inventorySidebarType == 'inventory') {
            if ($scope.locationList && $scope.locationList.length > 0) {
                $scope.inventoryLocationTreeViewSelected($scope.selectedItem);
                $scope.parentSelected = $scope.selected;
            }
        }
        if ($scope.inventorySidebarType != 'inventory') {
            if ($scope.truckList && $scope.truckList.length > 0) {
                $scope.inventoryTruckTreeViewSelected($scope.selectedItem);
            }
        }
        $scope.errorMessage = $scope.successMessage = null;
        $scope.addItemPopup = ngDialog.open({
            template: 'templates/inventory/addItemPopup.html?ver=' + $rootScope.PB_WEB_VERSION,
            className: 'ngdialog-theme-default v-center',
            scope: $scope,
            closeByDocument: true,
            trapFocus: false,
            preCloseCallback: function() {
                $scope.selected = null;
                $scope.parentSelected = null;
                // $scope.model = null;
                $scope.isShowSearchWidget = false;
            }
        })
    };   
    $scope.addLocationPopup = null;
    $scope.openAddLocationPopup = function(){
        $scope.model = angular.copy($scope.locationModel);
        $scope.tempPath = $rootScope.getTemporaryPath();
        $scope.errorMessage = $scope.successMessage = null;
        $scope.addLocationPopup = ngDialog.open({
            template: 'templates/inventory/addLocationPopup.html?ver=' + $rootScope.PB_WEB_VERSION,
            className: 'ngdialog-theme-default v-center',
            scope: $scope,
            closeByDocument: true,
            trapFocus: false,
            preCloseCallback: function() {
                $scope.deleteTempUploadedImages($scope.tempPath);
                // $scope.model = null;
                $scope.parentSelected = null;
                $scope.isSublocationType = false;
                $scope.selected = null;
                $scope.locationFormSubmitted = false;
                $scope.isFirstInitLoc = $scope.isFirstInitTruck = true;
                $scope.goToLanding();
                $scope.fetchData();
                $scope.inventoryImageProcessing = {};
            }
        })
    };
    $scope.editLocationPopup = null;
    $scope.openEditLocationPopup = function(){
        if (!$scope.selectedItemDetails) {
            $scope.selectedItemDetails = $scope.selectedItem;
        }
        $scope.model = angular.copy($scope.selectedItemDetails);
        $scope.tempPath = $scope.model.id;
        if ($scope.selectedItemDetails && $scope.selectedItemDetails.coverPhotos) {
            $scope.model.images = $scope.selectedItemDetails.coverPhotos;
            delete $scope.model.coverPhotos;
            if ($scope.model.images && $scope.model.images.length > 0) {
                angular.forEach($scope.model.images, function(image){
                    image.status = 1
                })
            }
        }
        if ($scope.model.parentId && $scope.model.parentId > 0) {
            $scope.isSublocationType = true;
            if($scope.locationList && $scope.locationList.length > 0) {
                angular.forEach($scope.locationList.sublocations, function(location){
                   if (location.id == $scope.model.parentId) {
                      $scope.parentSelected = location;
                   }
                });
            }
            $scope.inventoryLocationTreeView($scope.selectedItem);
        } else {
            $scope.isSublocationType = false;
        }
        $scope.isEditing = true;
        $scope.editLocationPopup = ngDialog.open({
            template: 'templates/inventory/editLocationPopup.html?ver=' + $rootScope.PB_WEB_VERSION,
            className: 'ngdialog-theme-default v-center',
            scope: $scope,
            closeByDocument: true,
            trapFocus: false,
            preCloseCallback: function() {
                $scope.isEditing = false;
                if ($scope.model && $scope.model.id) {
                    $scope.getLocationDetail($scope.model);
                }
                $scope.isFirstInitLoc = $scope.isFirstInitTruck = true;
                $scope.goToLanding();
                $scope.fetchData();
                let temp = angular.copy($scope.model);
                $scope.deleteS3ImagesInventory(temp);
                // $scope.model = null;
                $scope.parentSelected = null;
                $scope.selected = null;
                $scope.isSublocationType = false;
                $scope.inventoryImageProcessing = {};
                $scope.locationFormSubmitted = false;
            }
        })
    };    
    $scope.deleteLocationPopup = null;
    $scope.openDeleteLocationPopup = function(){
        $scope.model = angular.copy($scope.selectedItem);
        $scope.isChildPopOpen = true;
        $scope.deleteLocationPopup = ngDialog.open({
            template: 'templates/inventory/deleteLocationPopup.html?ver=' + $rootScope.PB_WEB_VERSION,
            className: 'ngdialog-theme-default v-center',
            scope: $scope,
            closeByDocument: true,
            preCloseCallback: function() {
                // do nothing
                $scope.isChildPopOpen = false;
                $scope.errorMessage = $scope.successMessage = null;
            }
        })
    };    
    $scope.deleteItemPopup = null;
    $scope.openDeleteItemPopup = function(){
        $scope.deleteItemPopup = ngDialog.open({
            template: 'templates/inventory/deleteItemPopup.html?ver=' + $rootScope.PB_WEB_VERSION,
            className: 'ngdialog-theme-default v-center',
            scope: $scope,
            closeByDocument: true,
            preCloseCallback: function() {
                // do nothing
                $scope.errorMessage = $scope.successMessage = null;
            }
        })
    };    
    $scope.getTreeDropDownLocation = function(locations = $scope.allLocationList, parentId = 0, fullyQualifiedName = '') {
        let transformedLocation = [];
        if (locations.length > 0) {
            locations.forEach(location => {
                let newFullyQualifiedName = fullyQualifiedName ? fullyQualifiedName + ' > ' + location.name : location.name;
                transformedLocation.push({
                    id: Number(location.id),
                    name: location.name,
                    fullyQualifiedName: newFullyQualifiedName,
                    ParentRef: parentId,
                    children: location.sublocations && location.sublocations.length > 0 ? $scope.getTreeDropDownLocation(location.sublocations, location.id, newFullyQualifiedName) : []
                });
            });
        }
        return transformedLocation;
    };
    
    $scope.getTreeDropDownTruck = function(trucks = $scope.allTruckList, parentId = 0, fullyQualifiedName = '') {
        let transformedTruck = [];
        if (trucks.length > 0) {
            trucks.forEach(truck => {
                let newFullyQualifiedName = fullyQualifiedName ? fullyQualifiedName + ' > ' + truck.name : truck.name;
                transformedTruck.push({
                    id: Number(truck.id),
                    name: truck.name,
                    fullyQualifiedName: newFullyQualifiedName,
                    ParentRef: parentId,
                    children: truck.sublocations && truck.sublocations.length > 0 ? $scope.getTreeDropDownTruck(truck.sublocations, truck.id, newFullyQualifiedName) : []
                });
            });
        }
        return transformedTruck;
    };
    
    $scope.closeAllPopup = function() {
        ngDialog.closeAll()
    }
    $scope.isSublocationType = false;
    $scope.toggleLocationType = function() {
        $scope.isSublocationType = !$scope.isSublocationType
    }
    $scope.setInventoryViewType = function(viewType) {
        if (viewType && viewType == $scope.inventoryViewType) {
            return;
        }
        $scope.inventoryViewType = viewType;
    }
    $scope.setInventorySidebarType = function(type) {
        $scope.inventorySidebarType = type;
        $scope.currentPage = $scope.showingFrom = 1;
        $scope.selectedSearchText = $scope.globalSearchText = '';
        $scope.goToLanding();
        $scope.fetchData();
    }
    
    // fetch data based on selected tab
    $scope.fetchData = function() {
        if ($scope.isFirstInitLoc && $scope.isFirstInitTruck) {
            $scope.getLocationList();
            $scope.getTruckList();
            return;
        }
    
        if ($scope.inventorySidebarType === 'inventory') {
            $scope.getLocationList();
        } else {
            $scope.getTruckList();
        }
    };
    
    // fetch location data
    $scope.getLocationList = function() {
        $scope.locationDetailFetching = true;
        let apiParams  = angular.copy($scope.getListPayload);
        apiParams.page = $scope.currentPage - 1;
        // if $scope.isFirstInitLoc = true - set no limit
        if ($scope.isFirstInitLoc) {
            delete apiParams.limit;
        }
        // Handle search params
        if ($scope.globalSearchText && $scope.globalSearchText != '') {
            apiParams.name = $scope.globalSearchText;
        }
        // handle sorting
        if ($scope.sortColumn) {
            apiParams.sortBy = $scope.sortColumn;
        }
        if ($scope.sortOrder) {
            apiParams.sortOrder = $scope.sortOrder;
        }
        
        apiGateWay.get('/inventory/locations_list', apiParams).then(function(response) {
            if (response.data.status == 200) {
                let rowItems = response.data.data;
                if (rowItems && rowItems[0].sublocations.length > 0) {
                    if ($scope.isFirstInitLoc) {
                        $scope.allLocationList = rowItems;
                        // show only 20 items in location list/grid view
                        $scope.locationList = rowItems.length > 20 ? rowItems.slice(0, 20) : rowItems;
                    } else {
                        $scope.locationList = rowItems;
                    }
                    // Call the function and store the transformed data
                    $scope.transformedLocation = $scope.getTreeDropDownLocation();
                } else {
                    if ($scope.isFirstInitLoc) {
                        $scope.allLocationList = [];
                    } else {
                        $scope.locationList = [];   
                    }
                }
                // set first init false
                if ($scope.isFirstInitLoc) {
                    $scope.isFirstInitLoc = false;
                }
            } else {
                $scope.locationList = [];
                $scope.allLocationList = [];
            }
            $scope.setAllLocationCollapsed();
            $scope.locationDetailFetching = false;
        }, function(error) {
            $scope.locationDetailFetching = false;
            $scope.errorMessage = error;
            $scope.showInventoryMessage();
        });
                
    }
    
    $scope.setLocatiomClicked = function(item) {
        angular.forEach($scope.allLocationList, function(Level1) {
            if (Level1.id == item.id) {
                Level1.selected = true;
                $scope.selected = Level1;
            }
            if (Level1.sublocations && Level1.sublocations.length > 0) {
                angular.forEach(Level1.sublocations, function(Level2) {
                    if (Level2.id == item.id) {
                        Level2.selected = true;
                        $scope.selected = Level2;
                    }
                    if (Level2.sublocations && Level2.sublocations.length > 0) {
                        angular.forEach(Level2.sublocations, function(Level3) {
                            if (Level3.id == item.id) {
                                Level3.selected = true;
                                $scope.selected = Level3;
                            }
                        });
                    }
                    if (Level2.sublocations && Level2.sublocations.length > 0) {
                        angular.forEach(Level2.sublocations, function(Level4) {
                            if (Level4.id == item.id) {
                                Level4.selected = true;
                                $scope.selected = Level4;
                            }
                        });
                    }
                });
            }
        });
    }
    
    // fetch truck data
    $scope.getTruckList = function() {
        $scope.locationDetailFetching = true;
        let apiParams = angular.copy($scope.getListPayload);
        apiParams.page = $scope.currentPage - 1;
        // Handle search params
        if ($scope.globalSearchText && $scope.globalSearchText != '') {
            apiParams.searchText = $scope.globalSearchText;
        }
        // handle sorting
        if ($scope.sortColumn) {
            apiParams.sortBy = $scope.sortColumn;
        }
        if ($scope.sortOrder) {
            apiParams.sortOrder = $scope.sortOrder;
        }
        // if $scope.isFirstInitTruck = true - set no limit
        if ($scope.isFirstInitLoc) {
            delete apiParams.limit;
        }
        apiGateWay.get('/inventory/truck_list', apiParams).then(function(response) {
            if (response.data.status == 200) {
                let rowItems = response.data.data.truckList;
                if (rowItems.length > 0) {
                    if ($scope.isFirstInitTruck) {
                        $scope.allTruckList = rowItems;
                        $scope.truckList  = rowItems.length > 20 ? rowItems.slice(0, 20) : rowItems;
                    } else {
                        $scope.truckList  = response.data.data.truckList;
                    }
                    $scope.totalItems = $scope.truckList.length;
                    $scope.totalRecord = response.data.data.totalCount;
                    $scope.totalPage = ($scope.totalRecord % $scope.limit) !== 0 ? parseInt($scope.totalRecord / $scope.limit) : parseInt(($scope.totalRecord / $scope.limit)) - 1;
                } else {
                    if ($scope.isFirstInitLoc) {
                        $scope.allTruckList = [];
                    } else {
                        $scope.truckList = [];   
                    }
                }
                if ($scope.isFirstInitTruck) {
                    $scope.isFirstInitTruck = false;
                }
            } else {
                $scope.truckList = [];
                $scope.allTruckList = [];
            }
            $scope.locationDetailFetching = false;
        }, function(error) {
            $scope.locationDetailFetching = false;
            $scope.errorMessage = error;
            $scope.showInventoryMessage();
        });
    }
    
    // save location data
    $scope.saveLocation = function() {
        let apiParams = angular.copy($scope.model);
        if ($scope.parentSelected) {
            apiParams.parentId = $scope.parentSelected.id;
        }
        if (!$scope.isSublocationType) {
            apiParams.parentId = 0;
        }
        $scope.isProcessing = true;
        // delete local images from payload which are deleted from UI without id
        if (apiParams.images && apiParams.images.length > 0) {
            apiParams.images = apiParams.images.filter(function(image) {
                return image.id !== undefined || image.status === 1;
            });
        }
        if (!$scope.isEditing) {
            let locationPayload = {
                "name": apiParams.name,
                "parentId": apiParams.parentId,
                "images": apiParams.images || []
              };
            apiGateWay.send('/inventory/create_location', locationPayload).then(function (response) {
                if (response.data.status == 200) {
                    $scope.copyImagesToInventory(locationPayload, response.data.data.locationId);
                    $scope.addLocationPopup.close();
                    $scope.goToLanding();
                    $scope.parentSelected = null;
                }
                $scope.isProcessing = false;
            }, function (error) {
                $scope.isProcessing = false;
                $scope.errorMessage = error;
                $scope.showInventoryMessage();
            });
        } else {
            let apiParams = angular.copy($scope.model);
            if ($scope.parentSelected) {
                apiParams.parentId = $scope.parentSelected.id;
            }
            if (!$scope.isSublocationType) {
                apiParams.parentId = 0;
            }
            let locationPayload = {
                "name": apiParams.name,
                "parentId": apiParams.parentId,
                "images": apiParams.images || [],
                "locationId": apiParams.id,
                "actionPerformed": $rootScope.actionPerformed
              };
            apiGateWay.put('/inventory/update_location', locationPayload).then(function (response) {
                if (response.data.status == 200) {
                    $scope.successMessage = response.data.message;
                    $scope.showInventoryMessage();
                    if ($scope.model && $scope.model.id) {
                        $scope.getLocationDetail($scope.model);
                    }
                }
                $scope.isProcessing = false;
            }, function (error) {
                $scope.isProcessing = false;
                $scope.errorMessage = error;
                $scope.showInventoryMessage();
            });
        }
    }
    // delete location data
    $scope.deleteLocation = function() {
        let apiParams = angular.copy($scope.model);
        $scope.isProcessing = true;
        apiGateWay.delete('/inventory/delete_location', {locationId: apiParams.id}).then(function (response) {
            if (response.data.status == 200) {
                $scope.parentSelected = null;
                $scope.selectedItem = null;
                $scope.isFirstInitLoc = $scope.isFirstInitTruck = true;
                $scope.goToLanding();
                $scope.fetchData();
                if ($scope.deleteLocationPopup) {
                    $scope.deleteLocationPopup.close();
                }
                if ($scope.editLocationPopup) {
                    $scope.editLocationPopup.close();
                }
                $scope.deleteTempUploadedImages(response.data.data.locationId);
            }
            $scope.isProcessing = false;
        }, function (error) {
            $scope.isProcessing = false;
            $scope.errorMessage = error;
            $scope.showInventoryMessage();
        });
    }
    // get location details
    $scope.getLocationDetail = function(item) {
        $scope.locationDetailFetching = true;
        let apiParams = {
            locationId: item && item.id ? item.id : 0
        }
        if ($scope.selectedSearchText && $scope.selectedSearchText && $scope.selectedSearchText != '') {
            apiParams.name = $scope.selectedSearchText
        }
        apiGateWay.get('/inventory/location_details', apiParams).then(function(response) {
            if (response.data.status == 200) {
                let allDetails  = response.data.data;
                if (allDetails.items && allDetails.items.length > 0) {
                    let newItems = [];
                    angular.forEach(allDetails.items, function(item){
                        if (item.images && item.images.length > 0) {
                            item.coverPhoto =  item.itemType == 'Product' ? $scope.awsCDNpath + item.images[0].fileName : item.images[0].fileName;
                        } else {
                            item.coverPhoto = null;
                        }
                        newItems.push(item);
                    });
                    if ($scope.selectedItem) {
                        $scope.selectedItem.items = newItems;
                    } else {
                        $scope.selectedItem = {};
                        $scope.selectedItem.items = newItems;
                    }
                } else {
                    $scope.selectedItem.items = [];
                }
                $scope.handleQuantity(allDetails);
                // if ($scope.itemDetailPopup) {
                //     $scope.itemDetailPopup.close();
                // }
                $scope.selectedItemDetails = allDetails.locationDetails && allDetails.locationDetails.length > 0 ? allDetails.locationDetails[0]: null;
                if ($scope.selectedItemDetails && $scope.selectedItemDetails.sublocations.length > 0) {
                    let newSubLocations = [];
                    angular.forEach($scope.selectedItemDetails.sublocations, function (location) {
                        if (location.coverPhotos && location.coverPhotos.length > 0) {
                            let coverImage = location.coverPhotos.find(image => image.isCoverPhoto === 1);
                            location.coverPhoto = coverImage ? coverImage.mediaPath : location.coverPhotos[0].mediaPath;
                        } else {
                            location.coverPhoto = null;
                        }
                        if (location.totalItems)  {
                            location.totalItemsCount = location.totalItems ? location.totalItems : 0;
                        }
                        newSubLocations.push(location);
                    });
                    if ($scope.selectedItem) {
                        $scope.selectedItem.sublocations = newSubLocations;
                    } else {
                        $scope.selectedItem = $scope.getSelectedItem($scope.allLocationList);
                        $scope.selectedItem.sublocations = newSubLocations;
                    }
                } else {
                    if ($scope.selectedItem) {
                        $scope.selectedItem.sublocations = [];   
                    } else {
                        $scope.selectedItem = $scope.getSelectedItem($scope.allLocationList);
                        $scope.selectedItem.sublocations = [];
                    }
                }
                if ($scope.selectedItemDetails && $scope.selectedItemDetails.coverPhotos && $scope.selectedItemDetails.coverPhotos.length > 0) {
                    let newImages = $scope.selectedItemDetails.coverPhotos;
                    angular.forEach(newImages, function(image){
                        image.status = 1
                    })
                    if ($scope.isEditing && $scope.model) {
                        $scope.model.images = newImages;
                    }
                }
            }
            $scope.locationDetailFetching = false;
        }, function(error) {
            $scope.locationDetailFetching = false;
            $scope.errorMessage = error;
            $scope.showInventoryMessage();
        });
    }
    
    // get truck details
    $scope.getTruckDetail = function(item) {
        let apiParams = { truckId: item && item.id ? item.id : 0 }
        if ($scope.selectedSearchText && $scope.selectedSearchText && $scope.selectedSearchText != '') {
            apiParams.name = $scope.selectedSearchText
        }
        $scope.locationDetailFetching = true;
        apiGateWay.get('/inventory/truck_details', apiParams).then(function(response) {
            if (response.data.status == 200) {
                $scope.selectedItemDetails = response.data.data;
                if ($scope.selectedItemDetails.items && $scope.selectedItemDetails.items.length > 0) {
                    let newItems = [];
                    angular.forEach($scope.selectedItemDetails.items, function(item){
                        if (item.images && item.images.length > 0) {
                            item.coverPhoto =  item.itemType == 'Product' ? $scope.awsCDNpath + item.images[0].fileName : item.images[0].fileName;
                        } else {
                            item.coverPhoto = null;
                        }
                        newItems.push(item);
                    });
                    if ($scope.selectedItem) {
                        $scope.selectedItem.items = newItems;
                    } else {
                        $scope.selectedItem = {};
                        $scope.selectedItem.items = newItems;
                    }
                } else {
                    if ($scope.selectedSearchText != '') {
                        $scope.selectedItem = [];
                    } else {
                        if ($scope.selectedItem) {
                            $scope.selectedItem.items = [];
                        } else {
                            $scope.selectedItem = $scope.getSelectedItem($scope.allTruckList);
                            $scope.selectedItem.items = [];
                        }
                    }
                }
                // handle paging for sub items
                $scope.totalItems = ($scope.selectedItemDetails.items || []).length;
                $scope.totalRecord =  $scope.totalItems;// response.data.data.totalCount; need to change later
                $scope.totalPage = ($scope.totalRecord % $scope.limit) !== 0 ? parseInt($scope.totalRecord / $scope.limit) : parseInt(($scope.totalRecord / $scope.limit)) - 1;
            }
            $scope.locationDetailFetching = false;
        }, function(error) {
            $scope.errorMessage = error;
            $scope.showInventoryMessage();
            $scope.locationDetailFetching = false;
        });
    }
    
    // set tree item as parent
    $scope.parentLocationSelect = function (location, isMove = false) {
        // Skip if it's the same object or null
        if (angular.equals($scope.parentSelected, location)) {
            return;
        }
        if (angular.equals($scope.selected, location)) {
            return;
        }
        $scope.parentSelected = location;

        if (!isMove && $scope.isEditing) {
            $scope.blurSaveLocation('parent-location');
        }
        // Optional: update text if needed
        // $scope.selectedCategoryItemText = $scope.parentSelected?.fullyQualifiedName?.replaceAll(':', ' > ');
    };
    // hide common search form
    $scope.$on("$destroy", function() {
        if ($rootScope.isCommonForm) {
            $rootScope.isCommonForm = false;
            $rootScope.isCategoryLoaded = false;
        }
    });
    // show errors
    $scope.showInventoryMessage = function() {
        $timeout(function() {
            $scope.successMessage = '';
            $scope.errorMessage = '';
        }, 3000);
    }
    
    // image uploading 
    $scope.inventoryImageUpload = function (event) {
        const MAX_IMAGES = 8;
        const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
        const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg'];
    
        const files = event.target.files;
        const file = files[0];
    
        // Check image count
        if ($scope.model.images && $scope.model.images.length >= MAX_IMAGES) {
            event.target.value = null;
            $scope.errorMessage = "Only 8 images are allowed";
            $timeout($scope.showInventoryMessage, 0); // delay to allow rendering
            return;
        }
    
        // File size validation
        if (file && file.size > MAX_FILE_SIZE) {
            event.target.value = null;
            $scope.errorMessage = "Maximum 2MB file size upload is allowed";
            $timeout($scope.showInventoryMessage, 0);
            return;
        }
    
        // File extension validation
        const extension = file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(extension)) {
            event.target.value = null;
            $scope.errorMessage = "Please select image format in JPEG, PNG or JPG.";
            $timeout($scope.showInventoryMessage, 0);
            return;
        }
    
        // Upload process
        const imageIndex = $scope.model.images ? $scope.model.images.length : 0;
        $scope.inventoryImageProcessing[imageIndex] = true;
    
        const uploadedFileName = $rootScope.getFileNameForUpload(file.name);
        const filePath = `${$scope.tempPath}/${uploadedFileName}.${extension}`;
        const s3Key = $scope.locationImageAwsPath + filePath;
    
        AwsS3Utility.upload(s3Key, file).then(function () {
            const imageObj = {
                fileName: s3Key,
                status: 1,
                isCoverPhoto: !$scope.model.images || $scope.model.images.length === 0 ? 1 : 0,
                mediaPath: $scope.awsCDNpath + s3Key
            };
    
            if (!$scope.model.images) {
                $scope.model.images = [];
            }
    
            $scope.model.images.push(imageObj);
            $scope.imageProcessing = false;
            $scope.inventoryImageProcessing[imageIndex] = false;
            event.target.value = null;
    
            if ($scope.isEditing) {
                $scope.blurSaveLocation('images');
            }
    
        }).catch(function (error) {
            $scope.errorMessage = error;
            $timeout($scope.showInventoryMessage, 0);
            $scope.imageProcessing = false;
            $scope.inventoryImageProcessing[imageIndex] = false;
            event.target.value = null;
            $scope.initS3Config();
        });
    };    
    
    // delete image from list
    $scope.deleteInventoryModelImage = function (image) {
        if ($scope.model.images && $scope.model.images.length > 0) {
            let imgIndex = $scope.model.images.indexOf(image);
            if (imgIndex != -1) {
                $scope.model.images[imgIndex].status = 0;
                // if deleted image is cover image, set new photo as cover image
                if ($scope.model.images[imgIndex].isCoverPhoto) {
                    $scope.model.images[imgIndex].isCoverPhoto = 0;
                    if ($scope.model.images.length > 0) {
                        let isCoverSet = false;
                        angular.forEach($scope.model.images, function (image) {
                            if (!isCoverSet && image.status != 0) {
                                isCoverSet = true;
                                image.isCoverPhoto = 1;
                            }
                        })
                    }
                }
                if ($scope.isEditing) {
                    $scope.blurSaveLocation('images');
                }
                // delete image from S3
                // let temp = angular.copy($scope.model);
                // $scope.deleteS3ImagesInventory(temp);
                // $scope.model.images.splice(imgIndex, 1);
            }
        }
    }
    // delete S3 image
    $scope.deleteS3ImagesInventory = function (item) {
        let itemsForDelete = []
        if (item && item.images && item.images.length > 0) {
            angular.forEach(item.images, function (image) {
                if (image.status == 0) {
                    let deleteFileName = $rootScope.extractFileNameFromURL(image.mediaPath);
                    deleteFileName = $scope.locationImageAwsPath + deleteFileName;
                    itemsForDelete.push(deleteFileName);
                }
            })
        }
        if (itemsForDelete && itemsForDelete.length > 0) {
            AwsS3Utility.deleteFiles(itemsForDelete)
                .then(function (data) {
                    // delete
                })
                .catch(function (error) {
                    // re init
                    $scope.initS3Config();
                })
        }
    }
    
    // delete all images
    $scope.deleteTempUploadedImages = function (tempId = 0) {
        if (tempId == 0 && !$scope.tempPath) {
            return
        }
        let awsURL = $scope.locationImageAwsPath;
        var oldPrefix = awsURL + (tempId == 0 ? $scope.tempPath : tempId) + '/';
        AwsS3Utility.list([oldPrefix]).then(function (data) {
            if (data[0].Contents.length) {
                var items_for_delete = [];
                angular.forEach(data[0].Contents, function (file, cb) {
                    let copySource = file.Key;
                    items_for_delete.push(copySource)
                });
                if (items_for_delete.length > 0) {
                    AwsS3Utility.deleteFiles(items_for_delete);
                }
            }
        })
    }
    
    // copy images to Inventory Location
    $scope.copyImagesToInventory = function(template, templateId) {
        let photosToCopy = [];
        if (template.images && template.images.length > 0) {
            template.images.forEach(function(item){
                if (!item.id) {
                    photosToCopy.push(item.fileName)
                }
            })           
        }
        if (photosToCopy.length) {
            var items = [];
            angular.forEach(photosToCopy, function(fileName) {
                let copySource = fileName;
                let key = fileName.replace($scope.tempPath, templateId);
                items.push({
                    sourceKey: copySource,
                    destinationKey: key
                });                                       
            });
            if (items.length > 0) {
                AwsS3Utility.copyFiles(items)
                .then(function(data) {
                    // nothing                                  
                    })
            }                   
        }
    }

    // set selected image as cover and un-set other cover image
    $scope.setInventoryCover = function(photos, coverImg) {
        if (!photos || photos.length == 0) {
            return;
        }
        if ($scope.model.images && $scope.model.images.length > 0) {
            angular.forEach($scope.model.images, function(image) {
                if (image.mediaPath == coverImg.mediaPath) {
                    image.isCoverPhoto = 1;
                } else {
                    image.isCoverPhoto = 0;
                }
            });
            if ($scope.isEditing) {
                $scope.blurSaveLocation('cover-image');
            }
        }
    }
    // sort item by name & direction 
    $scope.sortInventoryBy = function(name) {
        $scope.sortColumn = name;
        if ($scope.sortOrder == 'desc') {
            $scope.sortOrder = 'asc';
        } else {
            $scope.sortOrder = 'desc';
        }
        $scope.fetchData();
    }
    
    $scope.quantityReset = function() {
        $scope.quantityData.items = 0;
        $scope.quantityData.totalQty = 0;
        $scope.quantityData.totalValue = 0
        $scope.quantityData.sublocationsCount = 0;
    }
    
    // search on global
    var globalSearchTimeout;
    $scope.searchGlobally = function($event) {
        $scope.locationDetailFetching = true;
        $scope.globalSearchText = $event.target.value.trim().replace(/,/g, "");
        if (globalSearchTimeout) $timeout.cancel(globalSearchTimeout);
        globalSearchTimeout = $timeout(function() {
            $scope.isFirstInitLoc = $scope.isFirstInitTruck = true;
            $scope.goToLanding();
            $scope.fetchData();
        }, 1000); // delay 1 second
    }
    
    // search on selected
    var selectedSearchTimeout;
    $scope.searchOnSelected = function ($event) {
        $scope.selectedSearchText = $event.target.value.trim().replace(/,/g, "");
        $scope.locationDetailFetching = true;
        $scope.isGlobalSearching = false;
        if (!$scope.isLanding && $scope.selectedPath && $scope.selectedPath[0].id != 0) {
            $scope.selectedItem = $scope.getSelectedItem($scope.inventorySidebarType == 'inventory' ? $scope.allLocationList : $scope.allTruckList);
        }
        $scope.isGlobalSearching = !$scope.selectedItemDetails && ($scope.selectedItem || (!$scope.selectedItem && $scope.isLanding));
        if (selectedSearchTimeout) $timeout.cancel(selectedSearchTimeout);
        selectedSearchTimeout = $timeout(function () {
            if ($scope.inventorySidebarType == 'inventory') {
                if (!$scope.isGlobalSearching) {
                    $scope.getLocationDetail($scope.selectedItem);
                } else {
                    $scope.inventorySearch($scope.selectedSearchText);
                }
            } else {
                if (!$scope.isGlobalSearching) {
                    $scope.getTruckDetail($scope.selectedItem);
                } else {
                    $scope.inventorySearch($scope.selectedSearchText);
                }
            }
        }, 1000); // delay 1 second
    }
    
    // search location/truck
    $scope.inventorySearch = function (searchString) {
        // search from server if searchString
        if (searchString && searchString.length > 0) {
            let searchPayload = angular.copy($scope.getListPayload);
            if ($scope.inventorySidebarType == 'inventory') {
                searchPayload.name = searchString;
            } else {
                delete searchPayload.name;
                searchPayload.searchText = searchString;
            }
            searchPayload.page = $scope.currentPage - 1;
            searchPayload.sortBy = $scope.sortBy;
            searchPayload.sortOrder = $scope.sortColumn;
            apiGateWay.get('/inventory/' + ($scope.inventorySidebarType == 'inventory' ? 'locations' : 'truck') + '_list', searchPayload).then(function (response) {
                if (response.data.status == 200) {
                    // if search respose has data, handle items
                    let searchData = null;
                    if ($scope.inventorySidebarType == 'inventory') {
                        searchData = response.data.data[0];
                        $scope.isLanding = false;
                        $scope.handleQuantity(searchData);
                        let itemDetails = searchData;
                        if (itemDetails && itemDetails.coverPhotos && itemDetails.coverPhotos.length > 0) {
                            let newImages = itemDetails.coverPhotos;
                            angular.forEach(newImages, function (image) {
                                image.status = 1
                            })
                            allDetails.images = newImages;
                            delete itemDetails.coverPhotos;
                        }
                        $scope.selectedItem = itemDetails;
                        if (!$scope.selectedItem.items) {
                            $scope.selectedItem.items = [];
                        }
                        $scope.selectedItemDetails = null;
                    } else {
                        $scope.isLanding = false;
                        searchData = response.data.data.truckList;
                        $scope.selectedItem = searchData;
                        $scope.selectedItemDetails = null;
                        $scope.totalItems = searchData.length;
                        $scope.totalRecord = response.data.data.totalCount;
                        $scope.totalPage = ($scope.totalRecord % $scope.limit) !== 0 ? parseInt($scope.totalRecord / $scope.limit) : parseInt(($scope.totalRecord / $scope.limit)) - 1;
                    }
                } else {
                    $scope.isLanding = false;
                    $scope.selectedItem = null;
                }
                $scope.locationDetailFetching = false;
            }, function (error) {
                $scope.locationDetailFetching = false;
            });
        } else {
            // if search field is empty show all items from cache if available or fetch all
            $scope.selectedItem = $scope.getSelectedItem($scope.inventorySidebarType == 'inventory' ? $scope.allLocationList: $scope.allTruckList);
            $scope.locationDetailFetching = true;
            if ($scope.selectedItem) {
                $scope.isLanding = false;
                $scope.isGlobalSearching = false;
                $scope.currentPage = $scope.showingFrom = 1;
                if ($scope.inventorySidebarType == 'inventory') {
                    if ($scope.selectedItem.id == 0) {
                        $scope.goToLanding();
                        $scope.fetchData();
                    } else {
                        $scope.getLocationDetail($scope.selectedItem);
                    }
                } else {
                    $scope.getTruckDetail($scope.selectedItem);
                }
            } else {
                if ($scope.inventorySidebarType != 'inventory') {
                    $scope.getTruckList();
                }
                $scope.currentPage = $scope.showingFrom = 1;
                $scope.selectedItem = null;
                $scope.goToLanding();
                $scope.fetchData();
            }
        }
    }
    
    $scope.handleQuantity = function (data) {
        $scope.quantityReset();
        if (data) {
            if (data.totalItems) {
                $scope.quantityData.items = data.totalItems;
            }
            if (data.totalItemsCount) {
                $scope.quantityData.items = data.totalItemsCount;
            }
            if (data.totalQuantity) {
                $scope.quantityData.totalQty = data.totalQuantity;
            }
            if (data.totalValue) {
                $scope.quantityData.totalValue = data.totalValue;
            }
            if (data.totalSublocationCount) {
                $scope.quantityData.sublocationsCount = data.totalSublocationCount;
            }
        }
    }
    
    // inventory location tree view - parent view
    $scope.inventoryLocationTreeView = function (location) {
        if ($scope.transformedLocation && $scope.transformedLocation.length > 0) {
            ($scope.transformedLocation).map(function (v) {
                if (v.id === Number(location.parentId)) {
                    if (v) {
                        $scope.selected = v;
                    }
                }
                else if (v.id !== Number(location.parentId)) {
                    v.children.forEach(function (c) {
                        if (c.id === Number(location.parentId)) {
                            if (c) {
                                $scope.selected = c;
                            }
                        }
                        else if (c.id !== Number(location.parentId)) {
                            c.children.forEach(function (c2) {
                                if (c2.id === Number(location.parentId)) {
                                    if (c2) {
                                        $scope.selected = c2;
                                    }
                                }
                                else if (c2.id !== Number(location.parentId)) {
                                    c2.children.forEach(function (c3) {
                                        if (c3.id === Number(location.parentId)) {
                                            if (c3) {
                                                $scope.selected = c3;
                                            }
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            });
        }
    }
    // inventory location tree view - current location
    $scope.inventoryLocationTreeViewSelected = function (location) {
        if ($scope.transformedLocation && $scope.transformedLocation.length > 0) {
            ($scope.transformedLocation).map(function (v) {
                if (v.id === Number(location.id)) {
                    if (v) {
                        $scope.selected = v;
                    }
                }
                else if (v.id !== Number(location.id)) {
                    v.children.forEach(function (c) {
                        if (c.id === Number(location.id)) {
                            if (c) {
                                $scope.selected = c;
                            }
                        }
                        else if (c.id !== Number(location.id)) {
                            c.children.forEach(function (c2) {
                                if (c2.id === Number(location.id)) {
                                    if (c2) {
                                        $scope.selected = c2;
                                    }
                                }
                                else if (c2.id !== Number(location.id)) {
                                    c2.children.forEach(function (c3) {
                                        if (c3.id === Number(location.id)) {
                                            if (c3) {
                                                $scope.selected = c3;
                                            }
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            });
        }
    }
    // inventory truck tree view - current truck
    $scope.inventoryTruckTreeViewSelected = function (selectedTruck) {
        if ($scope.transformedTruck && $scope.transformedTruck.length > 0) {
            angular.forEach($scope.transformedTruck, function(truck){
                if (Number(truck.id) == Number(selectedTruck.id)) {
                    $scope.selected = truck;
                    $scope.parentSelected = truck;
                }
            });
        }
    }
    // auto save on blur event of form in edit mode
    $scope.blurSaveLocation = function(nodeName) {
        $rootScope.actionPerformed = nodeName;
        $scope.locationFormSubmitted = true;
        if ($scope.model.name && $scope.model.name.trim() != '') {
            $scope.saveLocation();
        }
    }
    
    // set truck as parent in tree view
    $scope.selectTruckparent = function (item) {
        if (item) {
            if ($scope.parentSelected && item.id == $scope.parentSelected.id) {
                return;
            }
            $scope.parentSelected = item;
        } else {
            $scope.parentSelected = item;
        }
    }
    
    // add/update and delete item in Inventory
    $scope.$on('productAddEvent', function (event, data) {
        if (data && data.widgetArea == 'inventory') {
            if (data.isClose) {
                // $scope.isShowSearchWidget = false
                $scope.model = angular.copy($scope.itemModel);
            } else {
                let itemForAddUpdate = data;
                $scope.isShowSearchWidget = false;
                if (itemForAddUpdate.images && itemForAddUpdate.images.length > 0) {
                    angular.forEach(itemForAddUpdate.images, function(image, index){
                        image.status = 1;
                        image.mediaPath = itemForAddUpdate.itemType == 'Tool' ? image.fileName : $scope.awsCDNpath + image.fileName;
                        if (index == 0) {
                            image.isCoverPhoto = 1;
                        }
                    })
                    if (!itemForAddUpdate.quantity) {
                        itemForAddUpdate.quantity = null;
                    }
                } else {
                    itemForAddUpdate.images = [];
                }
                $scope.model = itemForAddUpdate;
            }
        }
    });
    
    // add item to location/truck
    $scope.addInventoryItem = function() {
        if ($scope.model) {
            let item = angular.copy($scope.model);
            if (!item.name || item.name == '') {
                $scope.errorMessage = 'Please select a product or tool to add';
                $scope.showInventoryMessage();
                return;
            }
            if (!$scope.parentSelected || $scope.parentSelected.id == 0) {
                $scope.errorMessage = "Items can't be added on 'All Location'";
                $scope.showInventoryMessage();
                return;
            }
            let itemCost = (typeof item.cost === "number") ? item.cost : parseFloat(item.cost.replace(/[^0-9.-]/g, ''));
            let apiParams = {
                name: item.name,
                itemId: item.id,
                qty: item.quantity || 0,
                cost: itemCost,
                itemType: item.itemType,
                "actionPerformed": 'item-added'
            };
            if ($scope.inventorySidebarType == 'inventory') {
                apiParams.locationId = $scope.parentSelected.id;
            } else {
                apiParams.truckId = $scope.parentSelected.id;
            }
            $scope.isProcessing = true;
            apiGateWay.send('/inventory/add/' + ($scope.inventorySidebarType == 'inventory' ? 'location' : 'truck') + '_items', apiParams).then(function(response) {
                if (response.data.status == 200) {
                    $scope.successMessage = response.data.message;
                    if ($scope.inventorySidebarType == 'inventory') {
                        $scope.getLocationDetail($scope.selectedItem);
                    } else {
                        $scope.getTruckDetail($scope.selectedItem);
                    }
                    $timeout(function() { 
                        if ($scope.addItemPopup) {
                            $scope.addItemPopup.close();
                        }
                    }, 2000);
                    $scope.isShowSearchWidget = false;
                    $scope.isProcessing = false;
                } else {
                    $scope.errorMessage = response.data.message;
                }
                $scope.showInventoryMessage();
                $scope.isProcessing = false;
            }, function(error) {
                $scope.errorMessage = error;
                $scope.showInventoryMessage();
                $scope.isProcessing = false;
            });
        }
    }
    
    // revert selected item
    $scope.revertItem = function() {
        $scope.isShowSearchWidget = true;
        $scope.model = angular.copy($scope.itemModel);
    }
    // move item from source to destination
    $scope.moveInventoryItem = function() {
        if ($scope.childModel) {
            if (!$scope.parentSelected) {
                $scope.errorMessage = "Please select a destination " + $scope.moveType;
                $scope.showInventoryMessage();
                return;
            }
            $scope.isProcessing = true;
            let apiParams = {};
            if ($scope.inventorySidebarType == 'inventory') {
                apiParams = {
                    "sourceLocationId": $scope.selectedItemDetails.locationId,
                    "destinationId": $scope.parentSelected.id,
                    "destinationType": $scope.moveType,
                    "itemType": $scope.selectedItemDetails.itemType,
                    "itemId": $scope.selectedItemDetails.id,
                    "qty": $scope.childModel.qtytomove,
                    "cost": $scope.selectedItemDetails.price,
                    "actionPerformed": 'item-moved'
                }
            } else {
                apiParams = {
                    "sourceTruckId": $scope.selectedItem.id,
                    "destinationType": $scope.moveType,
                    "destinationId": $scope.parentSelected.id,
                    "itemType": $scope.selectedItemDetails.itemType,
                    "itemId": $scope.selectedItemDetails.id,
                    "qty": $scope.childModel.qtytomove,
                    "cost": $scope.selectedItemDetails.price,
                    "actionPerformed": 'item-moved'
                };
            }
            let apiEndPoint = '/inventory/transfer/' + ($scope.inventorySidebarType == 'inventory' ? 'location' : 'truck');
            apiGateWay.send(apiEndPoint, apiParams).then(function(response) {
                if (response.data.status == 200) {
                    $scope.successMessage = response.data.message;
                    $scope.showInventoryMessage();
                    if ($scope.inventorySidebarType == 'inventory') {
                        $scope.getLocationDetail($scope.selectedItem);
                    } else {
                        $scope.getTruckDetail($scope.selectedItem);
                    }
                    $timeout(function() { 
                        if ($scope.moveItemPopup) {
                            $scope.moveItemPopup.close();
                        }
                        if ($scope.itemDetailPopup) {
                            $scope.itemDetailPopup.close();
                        }
                    }, 1500);
                } else {
                    $scope.errorMessage = response.data.message;
                    $scope.showInventoryMessage();
                }
                $scope.isProcessing = false;
            }, function(error) {
                $scope.errorMessage = error;
                $scope.showInventoryMessage();
                $scope.isProcessing = false;
            });
        }
    }
    // remove Inventory Item from source
    $scope.removeInventoryItem = function() {
        if ($scope.model) {
            let item = angular.copy($scope.model);
            $scope.isProcessing = true;
            if ($scope.deleteItemPopup) {
                $scope.deleteItemPopup.close();
            }
            let apiParams = {
                itemId: item.id,
                itemType: item.itemType,
                quantity: item.qty,
                "actionPerformed": 'item-removed'
            };
            if ($scope.inventorySidebarType == 'inventory') {
                apiParams.locationId = item.locationId;
            } else {
                apiParams.truckId = $scope.selectedItem.id;
            }
            let apiEndPoint = '/inventory/remove/' + ($scope.inventorySidebarType == 'inventory' ? 'location' : 'truck');
            apiGateWay.delete(apiEndPoint, apiParams).then(function(response) {
                if (response.data.status == 200) {
                    $scope.successMessage = response.data.message;
                    if ($scope.inventorySidebarType == 'inventory') {
                        $scope.getLocationDetail($scope.selectedItem);
                    } else {
                        $scope.getTruckDetail($scope.selectedItem);
                    }
                    $timeout(function () {
                        if ($scope.itemDetailPopup) {
                            $scope.itemDetailPopup.close();
                        }
                    }, 1500);
                    $scope.isShowSearchWidget = false;
                } else {
                    $scope.errorMessage = response.data.message;
                }
                $scope.isProcessing = false;
                $scope.showInventoryMessage();
            }, function(error) {
                $scope.errorMessage = error;
                $scope.showInventoryMessage();
                $scope.isProcessing = false;
            });
        }
    }
    
    // update Inventory quantity
    $scope.updateInventoryItemQty = function() {
        if ($scope.selectedItemDetails) {
            $scope.isProcessing = true;
            let item = angular.copy($scope.selectedItemDetails);
            let apiParams = { itemId: item.id, itemType: item.itemType, qty: item.newQty, "actionPerformed": 'qty-updated' };
            if ($scope.inventorySidebarType == 'inventory') {
                apiParams.locationId = $scope.selectedItem.id;
            } else {
                apiParams.truckId = $scope.selectedItem.id;
            }
            let apiEndPoint = '/inventory/update/' + ($scope.inventorySidebarType == 'inventory' ? 'location' : 'truck') +'_items_qty';
            apiGateWay.put(apiEndPoint, apiParams).then(function(response) {
                if (response.data.status == 200) {
                    $scope.successMessage = response.data.message;
                    $scope.model = angular.copy($scope.selectedItemDetails);
                    if ($scope.model) {
                        $scope.model.qty = $scope.model.newQty;
                    }
                    if ($scope.updateQtyPopup) {
                        $scope.updateQtyPopup.close();
                    }
                    if ($scope.inventorySidebarType == 'inventory') {
                        $scope.getLocationDetail($scope.selectedItem);
                    } else {
                        $scope.getTruckDetail($scope.selectedItem);
                    }
                    $timeout(function () {
                        if ($scope.itemDetailPopup) {
                            $scope.itemDetailPopup.close();
                        }
                    }, 1500);
                } else {
                    $scope.errorMessage = response.data.message;
                }
                $scope.isProcessing = false;
                $scope.showInventoryMessage();
            }, function(error) {
                $scope.errorMessage = error;
                $scope.showInventoryMessage();
                $scope.isProcessing = false;
            });
        }
    }
    // move all quantity
    $scope.moveAllQuantity = function() {
        if ($scope.selectedItemDetails) {
            $scope.childModel.quantity = $scope.selectedItemDetails.qty;
            $scope.childModel.qtytomove = $scope.selectedItemDetails.qty;
            $scope.childModel.remaining = 0;
        }
    }
    // prepare item details images for display 
    $scope.prepareAndDisplayImages = function(selectedItemDetails) {
        // set media path based on product type and on of them as cover
        if (selectedItemDetails && selectedItemDetails.images) {
            let isCoverSet = false;
            angular.forEach(selectedItemDetails.images, function(image) {
                if (selectedItemDetails.itemType == 'Product') {
                    image.mediaPath = $scope.awsCDNpath + image.fileName;
                } else {
                    image.mediaPath = image.fileName;
                }
                // update status
                image.status = 1;
                // set first one as cover
                if (!isCoverSet && !image.isCoverPhoto) {
                    image.isCoverPhoto = true;
                }
            });
        }
        return selectedItemDetails;
    }
    $scope.toggleSubLocations = function(location) {
        location.isCollapsed = !location.isCollapsed
    }
    $scope.setAllLocationCollapsed = function() {        
        if ($scope.locationList && $scope.locationList.length > 0) {
            function traverseAndSet(nodes) {
                angular.forEach(nodes, function(node) {
                    node.isCollapsed = true;
                    if (node.sublocations && node.sublocations.length) {
                        traverseAndSet(node.sublocations);
                    }
                });
            }
            traverseAndSet($scope.locationList);
            $scope.locationList[0].isCollapsed = false;
        }
    };
    // paging 
    $scope.inventoryPaging = function(page) {
        $scope.currentPage = page;
        $scope.page = page;
        $scope.showingFrom = page* $scope.limit - ($scope.limit-1);
        $scope.getPaginatedData();
    };
    // move type select
    $scope.updateMoveType = function(value) {
        $scope.moveType = value;
    }
    
    // load data based on paging
    $scope.getPaginatedData = function () {
        let pagePaload = angular.copy($scope.getListPayload);
        // handle search string
        if ($scope.selectedSearchText && $scope.selectedSearchText.length > 0) {
            if ($scope.inventorySidebarType == 'inventory') {
                pagePaload.name = $scope.selectedSearchText;
            } else {
                delete pagePaload.name;
                pagePaload.searchText = $scope.selectedSearchText;
            }
        }
        pagePaload.page = $scope.currentPage - 1;
        pagePaload.sortBy = $scope.sortBy;
        pagePaload.sortOrder = $scope.sortColumn;
        $scope.locationDetailFetching = true;
        apiGateWay.get('/inventory/' + ($scope.inventorySidebarType == 'inventory' ? 'locations' : 'truck') + '_list', pagePaload).then(function (response) {
            if (response.data.status == 200) {
                // if new data handle items
                let pageData = null;
                // if ($scope.inventorySidebarType == 'inventory') {
                //     pageData = response.data.data[0];
                //     $scope.handleQuantity(pageData);
                //     let itemDetails = pageData;
                //     if (itemDetails && itemDetails.coverPhotos && itemDetails.coverPhotos.length > 0) {
                //         let newImages = itemDetails.coverPhotos;
                //         angular.forEach(newImages, function (image) {
                //             image.status = 1
                //         })
                //         allDetails.images = newImages;
                //         delete itemDetails.coverPhotos;
                //     }
                //     $scope.selectedItem = itemDetails;
                //     $scope.selectedItemDetails = null;
                // } else {
                    pageData = response.data.data.truckList;
                    $scope.isLanding = false;
                    $scope.selectedItem = pageData;
                    $scope.selectedItemDetails = null;
                    $scope.totalItems = pageData.length;
                    $scope.totalRecord = response.data.data.totalCount;
                    $scope.totalPage = ($scope.totalRecord % $scope.limit) !== 0 ? parseInt($scope.totalRecord / $scope.limit) : parseInt(($scope.totalRecord / $scope.limit)) - 1;
                // }
            }
            $scope.locationDetailFetching = false;
        }, function (error) {
            $scope.locationDetailFetching = false;
            $scope.errorMessage = error;
            $timeout($scope.showInventoryMessage, 0);
        });
    }
});