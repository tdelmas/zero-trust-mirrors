(function(){
	"use strict";
	
	function save(fileName, blob) {
		// maybe we should do like http://danml.com/download.html for better compatibility
		if (navigator.msSaveBlob){ // For ie and Edge
            return navigator.msSaveBlob(blob, fileName);
        }
		var a = document.createElement("a");
		var url = window.URL.createObjectURL(blob);
		a.style = "display: none"; 
		a.href = url;
		a.download = fileName;
		document.body.appendChild(a);
		a.click();
		URL.revokeObjectURL(url);
	}
	
	function buf2hex(arrayBuffer) {
		var array =  Array.prototype.map.call(new Uint8Array(arrayBuffer), function(x){
			return ('00' + x.toString(16)).slice(-2);
		});
		return array.join('');
	}


	function blob2arrayBuffer(blob, callback) {
		console.info("Convert to ArrayBuffer...");
		var fileReader = new FileReader();
		fileReader.onload = function(event) {
			console.info("Converted to ArrayBuffer.");
			callback(event.target.result);
		};
		fileReader.readAsArrayBuffer(blob)
	}
	
	function checksum(checksum_type, blob, callback) {
		// we can avoid ArrayBuffer for better compatibility by using a custom checksum function
		blob2arrayBuffer(blob, function(arrayBuffer){
			crypto.subtle.digest(checksum_type, arrayBuffer).then(function(arrayBufferRes){
				callback(buf2hex(arrayBufferRes));
			});
		});
	}
	
	function download(filename, url, checksum_type, checksum_value, safe) {
		if ( ! window.FileReader || ! window.Uint8Array || ! window.URL || ! URL.revokeObjectURL ) {
			// Can't check the checksum.
			if (safe) {
				// abort.
				return;
			} else {
				// trigger the download anyway
				window.location = url;
			}
		}
		var xhr = new XMLHttpRequest();
		xhr.open('get', url);
		xhr.responseType = "blob";
		
		function updateProgress (oEvent) {
			if (oEvent.lengthComputable) {
				var percentComplete = (100*oEvent.loaded / oEvent.total)|0;
				console.info(""+percentComplete+"%");
			}
		}
		
		function transferComplete(event) {
			var blob = xhr.response;
			console.info("Checksum...");
			checksum(checksum_type, blob, function(checksum_res){
				if ( checksum_value === checksum_res ) {
					console.info("Valid checksum. Saving...");
					save(filename, blob);
				} else {
					console.error("Invalid checksum");
				}
			});
		};
		xhr.addEventListener("progress", updateProgress, false);
		xhr.addEventListener("load", transferComplete, false);
		xhr.send(null);
	
	}
	
	download('vlc-3.0.6-win32.exe', 'https://ftp.free.org/mirrors/videolan/vlc/3.0.6/win32/vlc-3.0.6-win32.exe', 'SHA-256', 'e75697cae485a9206a416aaa3b3eb18c9010056d1fcb53e3658be086c7080724', true);
})()
