angular.module('POOLAGENCY').controller('trucksController', function($rootScope, $scope, $filter, ngDialog, $state, $timeout, apiGateWay, auth, AwsS3Utility, AwsConfigService, configConstant) {  
    $scope.trucksData = [];
    $scope.toolsData = [];      
    $scope.currentTabName = '';
    $scope.addEditPopup = null;
    $scope.deletePopup = null;
    $scope.isEditing = false;
    $scope.model = null;
    $scope.fetchingData = false;
    $scope.totalPage = 0;
    $scope.totalRecord = 0;
    $scope.totalItems = 0;
    $scope.limit = 20;
    $scope.currentPage = 1;
    $scope.tempPath = '';
    $scope.successMessage = '';
    $scope.errorMessage = '';
    $scope.techSearchBox = {techSearchText:''};
    $scope.techId = 0;
    $scope.selectedEvn = configConstant.currEnvironment;
    $scope.env = configConstant[$scope.selectedEvn];
    $scope.isProcessing = false;
    $scope.isDeleteImage = false;
    $scope.permissions = {};
    $scope.toolConditions = ['--', 'New', 'Like New', 'Very Good', 'Good', 'Fair', 'Poor', 'Very Poor'];
    $scope.itemsPerPage = [10,20,50,100];
    $scope.awsCDNpath = '';    
    $scope.truckImageAwsPath = '';
    $scope.toolImageAwsPath = '';
    $scope.truckImageProcessing = {};
    $scope.imageIndex = 0;
    if (auth.getSession()) {
        $scope.permissions = auth.getSession();
        if ($scope.permissions.canAccessTrucksAndToolsURL == 0) {
            $state.go("app.dashboard", {});
        }
    }
    $scope.apiPayload = {
        searchText: '',
        sortBy: '',
        sortOrder: '',
        page: 1,
        limit: 20,
    };
    $scope.sortColumn = "name",
    $scope.sortOrder = "desc";
    $scope.technicianList = [];
    $scope.techSearchText = "";
    $scope.techSearchKey = "";
    $scope.technicianPopup = null;
    $scope.technician = { id: 0 };
    $scope.viewType = 'tile';
    $scope.initConfig = function() {
        AwsConfigService.fetchAwsConfig().then(function(config) {
            $scope.awsCDNpath = config.domain;
        });
        $scope.truckImageAwsPath = $scope.env.awsAssetsPrefix + $scope.env.awsAssetsPathInventoryTrucks + $rootScope.userSession.companyId+'/';
        $scope.toolImageAwsPath = $scope.env.awsAssetsPrefix + $scope.env.awsAssetsPathInventoryTools + $rootScope.userSession.companyId+'/';
    }
    $timeout(function(){
        $scope.initConfig();
    }, 2000);
    $scope.openAddEditPopup = function(data){
        if (data && data.id) {
            $scope.model = data;
            $scope.isEditing = true;
            $scope.getTruckAndToolById(data.id);
            $scope.tempPath = $scope.model.id;
        } else {
            $scope.isEditing = false;
            $scope.tempPath = $rootScope.getTemporaryPath();
            if ($scope.currentTabName == 'trucks') {
                $scope.model = angular.copy($scope.truckModel);
            } else {
                $scope.model = angular.copy($scope.toolModel);
            }
        }
        $scope.addEditPopup = ngDialog.open({
            template: 'addEditPopup.html',
            className: 'ngdialog-theme-default v-center',
            scope: $scope,
            closeByDocument: true,  // Allow closing on outside click
            trapFocus: false,
            preCloseCallback: function() {
                if ($scope.isEditing) {
                    let temp = angular.copy($scope.model);
                    $scope.deleteS3Images(temp);
                } else {
                    $scope.deleteTempUploadedImages($scope.tempPath);
                }
                $scope.isEditing = false;
                $scope.model = null;
                $scope.formSubmitted = false;
                $scope.truckImageProcessing = {};
            }
        })
    };
    $scope.openDeletePopup = function(){
        $scope.deletePopup = ngDialog.open({
            template: 'deletePopup.html',
            className: 'ngdialog-theme-default v-center',
            scope: $scope,
            closeByDocument: true,  // Allow closing on outside click
            preCloseCallback: function() {
                
            }
        })
    };
    $scope.truckModel =  {
        "year": "",
        "make": "",
        "model": "",
        "color": "",
        "vin": "",
        "id": 0,
        "licensePlate": "",
        "name": "",
        "notes": "",
        "assignedTechId": 0,
        "assignedTechName": "",
        "assignedTechImage": "",
        "images": []
    };
    $scope.toolModel =  {
        "name": "",
        "cost": "$0.00",
        "condition": "",        
        "id": 0,
        "notes": "",
        "images": []
    };
        
    // fetch truck data
    $scope.getTrackDetails = function() {
        $scope.fetchingData = $scope.isDeleteImage ? false : true;;
        let apiParams  = angular.copy($scope.apiPayload);
        apiParams.page = $scope.currentPage - 1;
        if ($scope.sortColumn) {
            apiParams.sortBy = $scope.sortColumn;
        }
        if ($scope.sortOrder) {
            apiParams.sortOrder = $scope.sortOrder;
        }
        apiGateWay.get('/inventory/truck_list', apiParams).then(function(response) {
            if (response.data.status == 200) {
                $scope.trucksData  = response.data.data.truckList;
                $scope.totalItems = $scope.trucksData.length;
                $scope.totalRecord = response.data.data.totalCount;
                $scope.totalPage = ($scope.totalRecord % $scope.limit) !== 0 ? parseInt($scope.totalRecord / $scope.limit) : parseInt(($scope.totalRecord / $scope.limit)) - 1;
            } else {
                $scope.trucksData = [];
            }
            $scope.fetchingData = false;
        }, function(error) {
            $scope.fetchingData = false;
        });
                
    }
    // fetch tool data
    $scope.getToolDetails = function() {
        $scope.fetchingData = $scope.isDeleteImage ? false : true;;
        let apiParams = angular.copy($scope.apiPayload);
        apiParams.page = $scope.currentPage - 1;
        if ($scope.sortColumn) {
            apiParams.sortBy = $scope.sortColumn;
        }
        if ($scope.sortOrder) {
            apiParams.sortOrder = $scope.sortOrder;
        }
        apiGateWay.get('/inventory/tool_list', apiParams).then(function(response) {
            if (response.data.status == 200) {
                $scope.toolsData  = response.data.data.toolList;
                $scope.totalItems = $scope.toolsData.length;
                $scope.totalRecord = response.data.data.totalCount;
                $scope.totalPage   = $scope.totalRecord % $scope.limit !== 0 ? parseInt($scope.totalRecord / $scope.limit) : parseInt($scope.totalRecord / $scope.limit) - 1;
            } else {
                $scope.toolsData = [];
            }
            $scope.fetchingData = false;
        }, function(error) {
            $scope.fetchingData = false;
        });
    }
    // add/update truck and tool
    $scope.saveTruckAndTool = function () {
        $scope.isProcessing = true;
        let apiParams = angular.copy($scope.model);
        // check if cover photo is not set then set first image as cover photo
        if (apiParams.images && apiParams.images.length > 0) {
            let coverPhoto = apiParams.images.find(function(image) {
                return image.isCoverPhoto == 1;
            });
            if (!coverPhoto) {
                if (apiParams.images.length == 1) {
                    if (apiParams.images[0].status != 0) {
                        apiParams.images[0].isCoverPhoto = 1;
                    }
                } else {
                    let isCoverSet = false;
                    angular.forEach(apiParams.images, function(image) {
                         if (!isCoverSet && image.status != 0) {
                            image.isCoverPhoto = 1;
                            isCoverSet = true;
                         }
                    });
                }
            }
        }
        // delete local images from payload which are deleted from UI without id
        if (apiParams.images && apiParams.images.length > 0) {
            apiParams.images = apiParams.images.filter(function(image) {
                return image.id !== undefined || image.status === 1;
            });
        }
        if ($scope.isEditing) {
            let payload = {};
            if ($scope.currentTabName == 'trucks') {
                payload = {
                    "truckId": apiParams.id,
                    "name": apiParams.name,
                    "year": apiParams.year,
                    "make": apiParams.make,
                    "model": apiParams.model,
                    "color": apiParams.color,
                    "vin": apiParams.vin,
                    "licensePlate": apiParams.licensePlate,
                    "notes": apiParams.notes,
                    "images": apiParams.images || [],
                    "assignedTechId": apiParams.assignedTechId && apiParams.assignedTechId != null ? apiParams.assignedTechId : null,
                    "actionPerformed": $rootScope.actionPerformed
                }
            } else {
                let cost = (typeof apiParams.cost === "number") ? apiParams.cost : parseFloat(apiParams.cost.replace(/[^0-9.-]/g, ''));
                payload = {
                    "toolId": apiParams.id,
                    "name": apiParams.name,
                    "cost": cost,
                    "condition": apiParams.condition,
                    "notes": apiParams.notes,
                    "images": apiParams.images || [],
                    "actionPerformed": $rootScope.actionPerformed
                }
            }
            apiGateWay.put('/inventory/'+($scope.currentTabName == 'trucks' ? 'trucks' : 'tools'), payload).then(function (response) {
                if (response.data.status == 200) {
                    $scope.successMessage = response.data.message;
                    $scope.showMessage();
                    if (!$scope.isDeleteImage && !$scope.isEditing) {
                        $scope.addEditPopup.close();
                        $scope.model = null;
                    }
                    if ($scope.isDeleteImage) {
                        $scope.isDeleteImage = false;
                    }
                    $scope.isProcessing = false;
                    $scope.fetchData($scope.currentTabName);
                    // update images in open model
                    if ($scope.model && $scope.model.id) {
                        $scope.getTruckAndToolById($scope.model.id);
                    }
                }
            }, function (error) {
                $scope.errorMessage = error;
                $scope.isProcessing = false;
                $scope.showMessage();
            });
        } else {
            let payload = {};
            if ($scope.currentTabName == 'trucks') {
                payload = {
                    "name": apiParams.name,
                    "year": apiParams.year,
                    "make": apiParams.make,
                    "model": apiParams.model,
                    "color": apiParams.color,
                    "vin": apiParams.vin,
                    "licensePlate": apiParams.licensePlate,
                    "notes": apiParams.notes,
                    "images": apiParams.images || [],
                    "assignedTechId": apiParams.assignedTechId && apiParams.assignedTechId != null ? apiParams.assignedTechId : null
                }
            } else {
                let cost = (typeof apiParams.cost === "number") ? apiParams.cost : parseFloat(apiParams.cost.replace(/[^0-9.-]/g, ''));
                payload = {
                    "name": apiParams.name,
                    "cost": cost,
                    "condition": apiParams.condition,
                    "notes": apiParams.notes,
                    "images": apiParams.images || []
                }
            }
            apiGateWay.send('/inventory/'+($scope.currentTabName == 'trucks' ? 'trucks' : 'tools'), payload).then(function (response) {
                if (response.data.status == 200) {
                    // check and delete deleted images from S3
                    let newObj = angular.copy(payload);
                    let id = $scope.currentTabName == 'trucks' ? response.data.data.truckId : response.data.data.toolId;
                    $scope.copyImagesToTruckTool(newObj, id);                            
                    $scope.addEditPopup.close();
                    $scope.isProcessing = false;
                    $scope.model = null;
                    $scope.fetchData($scope.currentTabName);
                }
            }, function (error) {
                $scope.errorMessage = error;
                $scope.isProcessing = false;
                $scope.showMessage();
            });
        }
    }
    
    // delete truck data
    $scope.deleteTruckAndTool = function() {
        if ($scope.currentTabName == 'trucks' && $scope.model.assignedTechId && $scope.model.assignedTechId != null) {
            $scope.errorMessage = 'Truck can not be delete as a technician is already assigned';
            if ($scope.deletePopup) {
                $scope.deletePopup.close();
            }
            $scope.showMessage();
            return;
        }
        let payload = {};
        if ($scope.currentTabName == 'trucks') {
            payload = {
                "truckId": $scope.model.id
            }
        } else {
            payload = {
                "toolId": $scope.model.id
            }
        }
        $scope.isProcessing = true;
        apiGateWay.delete('/inventory/'+($scope.currentTabName == 'trucks' ? 'trucks' : 'tools'), payload).then(function(response) {
            if (response.data.status == 200) { 
                let id = $scope.currentTabName == 'trucks' ? response.data.data.truckId : response.data.data.toolId;;
                $scope.deleteTempUploadedImages(id);
                if ($scope.deletePopup) {
                    $scope.deletePopup.close();
                }
                if ($scope.addEditPopup) {
                    $scope.addEditPopup.close();
                }
                $scope.fetchData($scope.currentTabName);
                $scope.isProcessing = false;
            }
            $scope.isProcessing = false;
        }, function(error) {
            $scope.errorMessage = error;
            $scope.isProcessing = false;
            $scope.showMessage();
        });
    }
    
    // fetch truck and tool data
    $scope.fetchData = function(type) {
        // $scope.totalItems = 0;
        if (type == 'trucks') {
            $scope.getTrackDetails();
        }
        if (type == 'tools') {
            $scope.getToolDetails();
        }
    }
    // set selected image as cover and un-set other cover image
    $scope.setAsCover = function(photos, coverImg) {
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
                $scope.blurSaveForm('images');
            }
        }
    }
    // get truck and tool details by id 
    $scope.getTruckAndToolById = function(id) {
        $scope.isProcessing = true;
        let apiParams = {};
        if ($scope.currentTabName == 'trucks') {
            apiParams = {
                truckId: id
            }
        } else {
            apiParams = {
                toolId: id
            }
        }
        apiGateWay.get('/inventory/'+($scope.currentTabName == 'trucks' ? 'trucks' : 'tools'), apiParams).then(function(response) {
            if (response.data.status == 200) {
                $scope.model = response.data.data;
                // check if duplicate cover image exists then set first image as cover image and remove duplicate cover image
                if ($scope.model.images && $scope.model.images.length > 0) {
                    $scope.model.images = $rootScope.normalizeCoverPhotos($scope.model.images);
                }
            }
            $scope.isProcessing = false;
        }, function(error) {
            $scope.isProcessing = false;
        });
    }
    $scope.setViewType = function(view) {
        if ($scope.viewType == view) {
            return;
        }
        $scope.viewType = view;
    }  
    $scope.showMessage = function() {
        $timeout(function() {
            $scope.successMessage = '';
            $scope.errorMessage = '';
        }, 3000);
    }
    // truck & tools image uploading
    $scope.imageInputChange = function (e) {
        const maxImages = 8;
        const maxSize = 2 * 1024 * 1024; // 2MB
        const allowedExtensions = ['png', 'jpg', 'jpeg'];
        
        if (!$scope.model.images) {
            $scope.model.images = [];
        }
    
        if ($scope.model.images.length >= maxImages) {
            $scope.errorMessage = "Only 8 images are allowed";
            $timeout(function () {
                $scope.showMessage();
            }, 0);
            e.target.value = null;
            return;
        }
    
        const files = e.target.files;
        const file = files && files[0];
    
        if (!file) {
            $scope.errorMessage = "No file selected.";
            $timeout(function () {
                $scope.showMessage();
            }, 0);
            e.target.value = null;
            return;
        }
    
        if (file.size > maxSize) {
            $scope.errorMessage = "Maximum 2MB file size upload is allowed";
            $timeout(function () {
                $scope.showMessage();
            }, 0);
            e.target.value = null;
            return;
        }
    
        const extension = file.name.split('.').pop().toLowerCase();
    
        if (!allowedExtensions.includes(extension)) {
            $scope.errorMessage = "Please select image format in JPEG, PNG or JPG.";
            $timeout(function () {
                $scope.showMessage();
            }, 0);
            e.target.value = null;
            return;
        }
    
        const imageIndex = $scope.model.images.length;
        if (!$scope.truckImageProcessing) {
            $scope.truckImageProcessing = [];
        }
        $scope.truckImageProcessing[imageIndex] = true;
    
        let uploadedFileName = $rootScope.getFileNameForUpload(file.name);
        uploadedFileName = `${$scope.tempPath}/${uploadedFileName}.${extension}`;
    
        const key = $scope.currentTabName === 'trucks'
            ? $scope.truckImageAwsPath + uploadedFileName
            : $scope.toolImageAwsPath + uploadedFileName;
    
        AwsS3Utility.upload(key, file)
            .then(function () {
                const imageObj = {
                    fileName: key,
                    status: 1,
                    isCoverPhoto: $scope.model.images.length === 0 ? 1 : 0,
                    mediaPath: $scope.awsCDNpath + key
                };
    
                $scope.model.images.push(imageObj);
                if ($scope.isEditing) {
                    $scope.blurSaveForm('images');;
                }
            })
            .catch(function () {
                $scope.errorMessage = 'AWS config not loaded properly, please try again';
                $scope.showMessage();
                $scope.initConfig();
            })
            .finally(function () {
                $scope.truckImageProcessing[imageIndex] = false;
                e.target.value = null; // reset input
            });
    };
    
    $scope.openAssignTechnicianPopup = function(){
        if ($scope.model.assignedTechId && $scope.model.assignedTechId != 0) {
            $scope.techId = $scope.model.assignedTechId;
        }
        if ($scope.technicianList.length == 0) 
        {
          $scope.getTechnicianList();
        }
        $scope.technicianPopup = ngDialog.open({
            id: 11,
            template: 'templates/component/assignTechnician.html',
            className: "ngdialog-theme-default v-center",
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {
              $scope.techSearchText = "";
              $scope.techSearchKey = "";
              $scope.isProcessing = false;
            },
        });
    }

    $scope.getTechnicianList = function() {
        $scope.technicianList = [];
        var paramObj = {status: 'Active', offset: 0, limit: 30, searchKey:$scope.techSearchKey};
        apiGateWay.get("/technicians", paramObj).then(function(response) {
            if (response.data.status == 200) {
                var technicianListResponse = response.data.data;
                $scope.technicianList = technicianListResponse.data;
            } else {
                $scope.technicianList = [];
            }
        }, function(error){
            // handle error
        })
    };

    var tempFilterText = '', filterTextTimeout;
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
        }, 500); // delay 250 ms
    }

    $scope.assignTechnician = function (id, index) {
        if (id == 0) {
            $scope.model.assignedTechId = null;
            $scope.techId = 0;
            $scope.model.assignedTechName = '';
            $scope.model.assignedTechImage = ''
            $scope.technicianPopup.close();
        } else {
            let tech = $scope.technicianList.find(function (tech) {
                return tech.id == id;
            });
            if (!tech) {
                return;
            }
            $scope.model.assignedTechId = tech.id;
            $scope.model.assignedTechImage = tech.userImage;
            let lastName = tech.lastName ? tech.lastName.charAt(0).toUpperCase() + '.' : '';
            $scope.model.assignedTechName = tech.firstName + ' ' + lastName;
        }
        $scope.technicianPopup.close();
        if ($scope.isEditing) {
            $scope.blurSaveForm('technician');
        }
    }
    // delete image from list
    $scope.deleteModelImage = function (image) {
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
                    $scope.blurSaveForm('images');
                }
                // delete image from S3 and current model
                // let temp = angular.copy($scope.model);
                // $scope.deleteS3Images(temp);
                // $scope.model.images.splice(imgIndex, 1);
            }
        }
    }
    // delete S3 image
    $scope.deleteS3Images = function(item) {
        let itemsForDelete = []
        if (item && item.images && item.images.length > 0) {
            angular.forEach(item.images, function(image){
                if (image.status == 0) {
                    let deleteFileName = $rootScope.extractFileNameFromURL(image.mediaPath);
                    deleteFileName = $scope.currentTabName == 'trucks' ? $scope.truckImageAwsPath + deleteFileName : $scope.toolImageAwsPath + deleteFileName;
                    itemsForDelete.push(deleteFileName);               
                }
            })
        }
        if (itemsForDelete && itemsForDelete.length > 0) {
            AwsS3Utility.deleteFiles(itemsForDelete)
            .then(function(data) {
                // delete
            })
            .catch(function(error) {
                // re-init config
                $scope.initConfig();
            })      
        }           
    }

    var searchTextTimeout;
    $scope.searchTruckAndTools = function($event) {
        $scope.apiPayload.searchText = $event.target.value.trim().replace(/,/g, "");
        if (searchTextTimeout) $timeout.cancel(searchTextTimeout);
        searchTextTimeout = $timeout(function() {
            $scope.currentPage = 1;
            $scope.fetchData($scope.currentTabName);
        }, 500); // delay 250 ms
    }
    
    // assign tool condition
    $scope.assignToolCondition = function(name) {
        $scope.model.condition = name == '--' ? null : name;
        if ($scope.isEditing) {
            $scope.$scope.blurSaveForm('condition');
        }
    }
    
    // sort item by name & direction 
    $scope.sortOrderBy = function(name) {
        $scope.sortColumn = name;
        if ($scope.sortOrder == 'desc') {
            $scope.sortOrder = 'asc';
        } else {
            $scope.sortOrder = 'desc';
        }
        $scope.fetchData($scope.currentTabName);
    }
    
    // change page limit
    $scope.pageLimitChange = function(perPage) {
        $scope.apiPayload.limit = $scope.limit = perPage;
        $scope.fetchData($scope.currentTabName);
    }
    
    $scope.handlePaging = function(page) {
        $scope.currentPage = page;
        $scope.showingFrom = page* $scope.limit - ($scope.limit-1);
        $scope.fetchData($scope.currentTabName);
    };
    
    // delete all images
    $scope.deleteTempUploadedImages = function(tempId = 0) {
        if (tempId == 0 && !$scope.tempPath) {
            return
        }
        let awsURL = $scope.currentTabName == 'trucks' ? $scope.truckImageAwsPath : $scope.toolImageAwsPath;
        var oldPrefix  =  awsURL + (tempId == 0 ? $scope.tempPath : tempId) + '/';
        AwsS3Utility.list([oldPrefix]).then(function(data) {
            if (data[0].Contents.length) {
                var items_for_delete = [];
                angular.forEach(data[0].Contents, function(file, cb) {
                    let copySource = file.Key;                
                    items_for_delete.push(copySource)                                        
                });
                if (items_for_delete.length > 0) {
                    AwsS3Utility.deleteFiles(items_for_delete).then(function(data) {
                        // delete
                    })
                    .catch(function(error) {
                        // re-init config
                        $scope.initConfig();
                    })               
                }                   
            }
        })
    }
    
    // copy images to trucks & tools
    $scope.copyImagesToTruckTool = function(template, templateId) {
        let photosToCopy = [];
        if (template.images && template.images.length > 0) {
            angular.forEach(template.images, function(item){
                if (!item.id) {
                    photosToCopy.push(item.fileName);
                }
            })           
        }
        if (photosToCopy.length) {
            var items = [];
            angular.forEach(photosToCopy, function(element) {
                let source = element;
                let destination = element.replace($scope.tempPath + '/', templateId + '/');
                items.push({
                    sourceKey: source,
                    destinationKey: destination
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
    // auto save on blur event of form in edit mode
    $scope.blurSaveForm = function(nodeName) {
        $rootScope.actionPerformed = nodeName;
        $scope.isDeleteImage = true;
        // submit the hidden button programmatically
        $scope.formSubmitted = true;
        if ($scope.model.name && $scope.model.name.trim() != '') {
            $scope.saveTruckAndTool();
        }
    }
    // do not write code below this line
    // set current tab
    $scope.setCurrentTab = function(type) {
        $scope.currentTabName = type;
        $scope.currentPage = 1;
        $scope.apiPayload.searchText = '';
        $scope.sortColumn = null;
        $scope.sortOrder = null;
        // $scope.apiPayload.limit = $scope.limit = 10;
        $scope.fetchData($scope.currentTabName);
        if (type == 'trucks' && $scope.technicianList.length == 0) {
            $scope.getTechnicianList();
        }
    }
    $scope.setCurrentTab('trucks');
});