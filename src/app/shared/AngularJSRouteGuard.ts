import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from "@angular/router";

@Injectable({
	providedIn: 'root',
})
export class AngularJSRouteGuard implements CanActivate {
	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
	  // This guard prevents Angular from handling non-angular (AngularJs) routes.
	  return this.isAngularJsUrl(state.url); 
	}
	
	// checks whether a URL is an AngularJS route
	isAngularJsUrl(url: any): boolean {
		return (url.includes('app') || url.includes('login')) ? false: true;
	}
	
  }