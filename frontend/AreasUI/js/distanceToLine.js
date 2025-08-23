// Code to find the distance in metres between a lat/lng point and a polyline of lat/lng points
// All in WGS84. Free for any use.
//
// Bill Chadwick 2007
// updated to Google Maps API v3, Lawrence Ross 2014

        // Construct a bdccGeo from its latitude and longitude in degrees
        function bdccGeo(lat, lon) 
        {
            var theta = (lon * Math.PI / 180.0);
            var rlat = bdccGeoGeocentricLatitude(lat * Math.PI / 180.0);
            var c = Math.cos(rlat); 
            this.x = c * Math.cos(theta);
            this.y = c * Math.sin(theta);
            this.z = Math.sin(rlat);  
			this.lat = lat;
			this.lng = lon;
        }
        bdccGeo.prototype = new bdccGeo();

        // internal helper functions =========================================

        // Convert from geographic to geocentric latitude (radians).
        function bdccGeoGeocentricLatitude(geographicLatitude) 
        {
            var flattening = 1.0 / 298.257223563;//WGS84
            var f = (1.0 - flattening) * (1.0 - flattening);
            return Math.atan((Math.tan(geographicLatitude) * f));
        }

         // Returns the two antipodal points of intersection of two great
         // circles defined by the arcs geo1 to geo2 and
         // geo3 to geo4. Returns a point as a Geo, use .antipode to get the other point
        function bdccGeoGetIntersection( geo1,  geo2,  geo3,  geo4) 
        {
            var geoCross1 = geo1.crossNormalize(geo2);
            var geoCross2 = geo3.crossNormalize(geo4);
            return geoCross1.crossNormalize(geoCross2);
        }

        //from Radians to Meters
        function bdccGeoRadiansToMeters(rad)
        {
            return rad * 6378137.0; // WGS84 Equatorial Radius in Meters
        }

        //from Meters to Radians
        function bdccGeoMetersToRadians(m)
        {
            return m / 6378137.0; // WGS84 Equatorial Radius in Meters
        }

        // properties =================================================


        bdccGeo.prototype.getLatitudeRadians = function() 
        {
            return (bdccGeoGeographicLatitude(Math.atan2(this.z,
                Math.sqrt((this.x * this.x) + (this.y * this.y)))));
        }

        bdccGeo.prototype.getLongitudeRadians = function() 
        {
            return (Math.atan2(this.y, this.x));
        }

        bdccGeo.prototype.getLatitude = function() 
        {
            return this.getLatitudeRadians()  * 180.0 / Math.PI;
        }

        bdccGeo.prototype.getLongitude = function() 
        {
            return this.getLongitudeRadians()  * 180.0 / Math.PI ;
        }

        // Methods =================================================

        //Maths
        bdccGeo.prototype.dot = function( b) 
        {
            return ((this.x * b.x) + (this.y * b.y) + (this.z * b.z));
        }

        //More Maths
        bdccGeo.prototype.crossLength = function( b) 
        {
            var x = (this.y * b.z) - (this.z * b.y);
            var y = (this.z * b.x) - (this.x * b.z);
            var z = (this.x * b.y) - (this.y * b.x);
            return Math.sqrt((x * x) + (y * y) + (z * z));
        }

      //More Maths
        bdccGeo.prototype.scale = function( s) 
        {
            var r = new bdccGeo(0,0);
            r.x = this.x * s;
            r.y = this.y * s;
            r.z = this.z * s;
            return r;
        }

        // More Maths
        bdccGeo.prototype.crossNormalize = function( b) 
        {
            var x = (this.y * b.z) - (this.z * b.y);
            var y = (this.z * b.x) - (this.x * b.z);
            var z = (this.x * b.y) - (this.y * b.x);
            var L = Math.sqrt((x * x) + (y * y) + (z * z));
            var r = new bdccGeo(0,0);
            r.x = x / L;
            r.y = y / L;
            r.z = z / L;
            return r;
        }

      // point on opposite side of the world to this point
        bdccGeo.prototype.antipode = function() 
        {
            return this.scale(-1.0);
        }






        //distance in radians from this point to point v2
        bdccGeo.prototype.distance = function( v2) 
        {
            return Math.atan2(v2.crossLength(this), v2.dot(this));
        }

      //returns in meters the minimum of the perpendicular distance of this point from the line segment geo1-geo2
      //and the distance from this point to the line segment ends in geo1 and geo2 
        bdccGeo.prototype.distanceToLineSegMtrs = function(geo1, geo2)
        {            

            //point on unit sphere above origin and normal to plane of geo1,geo2
            //could be either side of the plane
            var p2 = geo1.crossNormalize(geo2); 

            // intersection of GC normal to geo1/geo2 passing through p with GC geo1/geo2
            var ip = bdccGeoGetIntersection(geo1,geo2,this,p2); 

            //need to check that ip or its antipode is between p1 and p2
            var d = geo1.distance(geo2);
            var d1p = geo1.distance(ip);
            var d2p = geo2.distance(ip);
            //window.status = d + ", " + d1p + ", " + d2p;
            if ((d >= d1p) && (d >= d2p)) 
                return bdccGeoRadiansToMeters(this.distance(ip));
            else
            {
                ip = ip.antipode(); 
                d1p = geo1.distance(ip);
                d2p = geo2.distance(ip);
            }
            if ((d >= d1p) && (d >= d2p)) 
                return bdccGeoRadiansToMeters(this.distance(ip)); 
            else 
                return bdccGeoRadiansToMeters(Math.min(geo1.distance(this),geo2.distance(this))); 
        }
		
		bdccGeo.prototype.closestPointOnSeg = function(geo1, geo2)
        {            

            //point on unit sphere above origin and normal to plane of geo1,geo2
            //could be either side of the plane
            var p2 = geo1.crossNormalize(geo2); 

            // intersection of GC normal to geo1/geo2 passing through p with GC geo1/geo2
            var ip = bdccGeoGetIntersection(geo1,geo2,this,p2); 

            //need to check that ip or its antipode is between p1 and p2
            var d = geo1.distance(geo2);
            var d1p = geo1.distance(ip);
            var d2p = geo2.distance(ip);
            //window.status = d + ", " + d1p + ", " + d2p;
            
            if (d1p > d2p)
				return geo2;
			return geo1;
        }

        // distance in meters from GLatLng point to GPolyline or GPolygon poly
        function bdccGeoDistanceToPolyMtrs(poly, point)
        {
            var d = 999999999;
            var i;
            var p = new bdccGeo(point.lat(),point.lng());
            for(i=0; i<(poly.getPath().getLength()-1); i++)
                 {
                    var p1 = poly.getPath().getAt(i);
                    var l1 = new bdccGeo(p1.lat(),p1.lng());
                    var p2 = poly.getPath().getAt(i+1);
                    var l2 = new bdccGeo(p2.lat(),p2.lng());
                    var dp = p.distanceToLineSegMtrs(l1,l2);
                    if(dp < d)
                        d = dp;    
                 }
             return d;
        }
		
		function closestPointOnPoly(poly, point)
        {
			var closetPoint;
            var d = 999999999;
            var i;
            var p = new bdccGeo(point.lat(),point.lng());
            for(i=0; i<(poly.getPath().getLength()-1); i++)
                 {
                    var p1 = poly.getPath().getAt(i);
                    var l1 = new bdccGeo(p1.lat(),p1.lng());
                    var p2 = poly.getPath().getAt(i+1);
                    var l2 = new bdccGeo(p2.lat(),p2.lng());
                    var dp = p.distanceToLineSegMtrs(l1,l2);
                    if(dp < d)
					{
                        d = dp;  
						closetPoint = p.closestPointOnSeg(l1,l2);				
					}
                 }
             return closetPoint;
        }

        // get a new GLatLng distanceMeters away on the compass bearing azimuthDegrees
        // from the GLatLng point - accurate to better than 200m in 140km (20m in 14km) in the UK

        function bdccGeoPointAtRangeAndBearing (point, distanceMeters, azimuthDegrees) 
        {
             var latr = point.lat() * Math.PI / 180.0;
             var lonr = point.lng() * Math.PI / 180.0;

             var coslat = Math.cos(latr); 
             var sinlat = Math.sin(latr); 
             var az = azimuthDegrees* Math.PI / 180.0;
             var cosaz = Math.cos(az); 
             var sinaz = Math.sin(az); 
             var dr = distanceMeters / 6378137.0; // distance in radians using WGS84 Equatorial Radius
             var sind = Math.sin(dr); 
             var cosd = Math.cos(dr);

            return new google.maps.LatLng(Math.asin((sinlat * cosd) + (coslat * sind * cosaz)) * 180.0 / Math.PI,
            (Math.atan2((sind * sinaz), (coslat * cosd) - (sinlat * sind * cosaz)) + lonr) * 180.0 / Math.PI); 
        }