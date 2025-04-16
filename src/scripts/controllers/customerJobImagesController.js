angular.module('POOLAGENCY')

.controller('customerJobImagesController', function($rootScope,$scope,apiGateWay, ngDialog, $timeout, service, $state, $stateParams,$q) {

    $scope.jobId = $stateParams.jobId;

    $scope.model = {selectAll: false};
    $scope.allImages = [];
    $scope.imageArray = {};
    $scope.imageKeyArray = [];
    $scope.selectedImages = [];
    $scope.allImageObjects = [];

    $scope.showImageInModal = function(jobId){
        if(jobId){
          $scope.jobId = jobId;
          
          ngDialog.open({
              template: 'templates/customerjobimages.html?ver=' + $rootScope.PB_WEB_VERSION,
              className: 'ngdialog-theme-default',
              scope: $scope,
              preCloseCallback: function() {

              }
          });
        }
    }


    $scope.downloadFile = function(url){
        var fileName = url.substr(url.lastIndexOf("/")+1);
        var imageUrl = url;
            var tag = document.createElement('a');
            tag.href = imageUrl;
            tag.download = fileName;
            tag.setAttribute('target','_blank');
            document.body.appendChild(tag);
            tag.click();
            document.body.removeChild(tag);
        /* var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "blob";
        xhr.onload = function(){
            var urlCreator = window.URL || window.webkitURL;
            var imageUrl = urlCreator.createObjectURL(this.response);
            var tag = document.createElement('a');
            tag.href = imageUrl;
            tag.download = fileName;
            document.body.appendChild(tag);
            tag.click();
            document.body.removeChild(tag);
        }
        xhr.send(); */
    }
    $scope.downloadZIPUrl = '';
    $scope.changingShowCaptionInCustomerEmail = false;
    $scope.toggleShowCaptionInCustomerEmail = function() {
        let status = angular.copy($rootScope.showCaptionInCustomerEmail)        
        $scope.changingShowCaptionInCustomerEmail = true;
        apiGateWay.send("/show_caption_on_images", {
            jobId: $scope.jobId,
            showCaption: status ? 0 : 1
        }).then(function(response) {
            if(response.data && response.data.status == 200){
                $rootScope.showCaptionInCustomerEmail = !$rootScope.showCaptionInCustomerEmail;
            }
            $scope.changingShowCaptionInCustomerEmail = false;
        }, function(error){
            $scope.changingShowCaptionInCustomerEmail = false;
        });
    }
    $scope.jobImages = function() {
        if ($scope.jobId) {
            $scope.downloadZIPUrl = '';
            var imageArray = [];
            var allImages = [];
            var allImageObjects = [];
            var imageKeyArray = []
            $scope.imageKeyArray = [];
            $scope.isProcessing = true;
            apiGateWay.get("/job_images", {
                jobId: $scope.jobId
            }).then(function(response) {
                  if(response.data && response.data.status == 200 && response.data.data.length > 0){
                      var responseData = response.data.data;
                      angular.forEach(responseData, function(element, index){
                         if (element.assetsType) {
                            if(typeof imageArray[element.assetsType] == 'undefined'){
                                imageArray[element.assetsType] = []
                                imageKeyArray.push(element.assetsType);
                            }
                            if(element.filePhisicalPath){
                                allImages.push(element.filePath);
                            }
                            allImageObjects.push(element);
                            element.fileThumbPath = element.fileThumbPath.replace("+", "%2B");
                            imageArray[element.assetsType].push(element);
                         }
                      });
                      $scope.imageArray = imageArray;
                      $scope.allImages = allImages;
                      $scope.allImageObjects = allImageObjects;
                      $scope.imageKeyArray = imageKeyArray

                  }else{
                      $scope.imageArray = [];
                  }
                  $scope.isProcessing = false;
            });

          }
      }
      $scope.isProcessing = false
      $scope.selectAll = function(){
          $scope.selectedImages = $scope.model.selectAll ? angular.copy($scope.allImages) : [];
          if (!$scope.$$phase) $scope.$apply();
      }

      $scope.checkUnCheckImage = function(imagePath){
          var imageIndex = $scope.selectedImages.indexOf(imagePath)
          if(imageIndex == -1){
              $scope.selectedImages.push(imagePath);
          }else{
              $scope.selectedImages.splice(imageIndex, 1);
          }
          setTimeout(function(){
              $scope.model.selectAll = $scope.selectedImages.length == $scope.allImages.length ? true : false;
              if (!$scope.$$phase) $scope.$apply();
          }, 50);

      }


      inProgressFunc = function(){
        $scope.isProcessing = true;
        setTimeout(function(){
          $scope.isProcessing = false
        }, 100);
      }

      $scope.downloadAllImages = function(){
          if($scope.allImages.length > 0){
              angular.forEach($scope.allImages, function(element){
                  $scope.downloadFile(element);
              });
          }
      }


      //to show pictures in dialog
      $scope.imageStartIndex = 0;
      $scope.showPictures = function(event, imageObj) {

          if(event.target.className.indexOf('download') != -1 || event.target.className.indexOf('check') != -1 || imageObj.filePhisicalPath == ''){
              event.preventDefault();
              return;
          }
          $scope.imageStartIndex = $scope.allImageObjects.indexOf(imageObj) != -1 ? $scope.allImageObjects.indexOf(imageObj) : 0;
          $scope.imageObj = imageObj;
          


          if (!$scope.$$phase) $scope.$apply();

          ngDialog.open({
              template: 'picturesVideos.html',
              className: 'ngdialog-theme-default',
              scope: $scope,
              preCloseCallback: function() {
                $scope.imageObj = '';
              }
          });
      };
    document.onkeydown = function (e) { 
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
    };

    $scope.loadJSZip = function () {
        let deferred = $q.defer();
        if (window.JSZip) {
            deferred.resolve();
        } else {
            let script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            script.onload = function () {
                deferred.resolve();
            };
            script.onerror = function () {
                console.error("Failed to load JSZip.");
                deferred.reject("Error loading JSZip");
            };
            document.body.appendChild(script);
        }
        return deferred.promise;
    };
    
    $scope.creatingZip = false;
    $scope.creatingZipError = '';
    $scope.downloadZip = function () {
        if ($scope.allImages && $scope.allImages.length > 0) {
            $scope.creatingZip = true;
            $scope.loadJSZip().then(() => { 
                try {
                    let zip = new JSZip();
                    let validFiles = []; // Track successfully fetched images
                
                    let promises = $scope.allImages.map(url => {
                        let fileName = url.split('/').pop();
                        if (!fileName.includes('.')) {
                            fileName = fileName + '.jpg';
                        }return fetch(url + '?t=' + Date.now(), { mode: 'cors'} )
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error(`Failed to fetch ${url} - ${response.statusText}`);
                                }
                                return response.blob();
                            })
                            .then(blob => {
                                zip.file(fileName, blob);
                                validFiles.push(fileName); // Store valid files
                            })
                            .catch(err => {
                                console.warn(`Skipping image due to error: ${url}`, err);
                            });
                    });                
                    Promise.all(promises)
                        .then(() => {
                            if (validFiles.length === 0) {
                                $scope.creatingZipError = " Unable to download all files. Please try again.";
                                $scope.creatingZip = false;
                                if (!$scope.$$phase) $scope.$apply();
                                $timeout(function(){
                                    $scope.creatingZipError = "";
                                },2000)
                                return;
                            }                
                            zip.generateAsync({ type: "blob" })
                                .then(content => {
                                    try {
                                        let a = document.createElement("a");
                                        a.href = URL.createObjectURL(content);
                                        a.download = `images_${generateUUID()}.zip`;
                                        a.click();
                                    } catch (error) {
                                        console.error("Error creating download link:", error);
                                    } finally {
                                        $scope.creatingZip = false;
                                        if (!$scope.$$phase) $scope.$apply();
                                    }
                                })
                                .catch(err => {
                                    console.error("Error generating zip file:", err);
                                    $scope.creatingZip = false;
                                    if (!$scope.$$phase) $scope.$apply();
                                });
                        });
                } catch (error) {
                    console.error("Unexpected error in downloadZip:", error);
                    $scope.creatingZip = false;
                    if (!$scope.$$phase) $scope.$apply();
                }                
            }).catch(err => {
                $scope.creatingZip = false;
                if (!$scope.$$phase) $scope.$apply();
                console.error("Error loading JSZip or fetching images:", err);
            });
        }    
    };
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          let r = (Math.random() * 16) | 0,
            v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      }
});
