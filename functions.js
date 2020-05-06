if(localStorage.getItem("LocalData") == null)
{
    var data = [];
    data = JSON.stringify(data);
    localStorage.setItem("LocalData", data);
}


function getParameterByName( name, url ) {
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\#?&]"+name+"=([^&#]*)";
	var regex = new RegExp( regexS );
	var results = regex.exec( url );
	if( results == null )
		return "";
	else
		return decodeURIComponent(results[1].replace(/\+/g, " "));
}

function scan()
{
    cordova.plugins.barcodeScanner.scan(
        function (result) {
            if(!result.cancelled)
            {
                if(result.format == "QR_CODE")
            	var scannedSecret = getParameterByName('secret', result.text);
                localStorage.setItem('secret', scannedSecret);
            	$("#qr").text(scannedSecret)
            	$(".newSecret").val(scannedSecret);
				startAuthenticator()
            }
        },
        function (error) {
            alert("Scanning failed: " + error);
        }
   )
}



function dec2hex(s) { return (s < 15.5 ? '0' : '') + Math.round(s).toString(16); }
    function hex2dec(s) { return parseInt(s, 16); }

    function base32tohex(base32) {
        var base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        var bits = "";
        var hex = "";

        for (var i = 0; i < base32.length; i++) {
            var val = base32chars.indexOf(base32.charAt(i).toUpperCase());
            bits += leftpad(val.toString(2), 5, '0');
        }

        for (var i = 0; i+4 <= bits.length; i+=4) {
            var chunk = bits.substr(i, 4);
            hex = hex + parseInt(chunk, 2).toString(16) ;
        }
        return hex;

    }

    function leftpad(str, len, pad) {
        if (len + 1 >= str.length) {
            str = Array(len + 1 - str.length).join(pad) + str;
        }
        return str;
    }

    function updateOtp() {
            
        var key = base32tohex($('.newSecret').val());
        var epoch = Math.round(new Date().getTime() / 1000.0);
        var time = leftpad(dec2hex(Math.floor(epoch / 30)), 16, '0');

        console.log('debug:' + key);
        console.log('debug:' + epoch);
        console.log('debug:' + time);

        // updated for jsSHA v2.0.0 - http://caligatio.github.io/jsSHA/
        var shaObj = new jsSHA("SHA-1", "HEX");
        shaObj.setHMACKey(key, "HEX");
        shaObj.update(time);
        var hmac = shaObj.getHMAC("HEX");

        var user = 'Okta: mark.maf@okta-demo.nl'
        $('#qrImg').attr('src', 'https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=200x200&chld=M|0&cht=qr&chl=otpauth://totp/'+ user +'%3Fsecret%3D' + $('#secret').val());
        $('#secretHex').text(key);
        $('#secretHexLength').text((key.length * 4) + ' bits'); 
        $('#epoch').text(time);
        $('#hmac').empty();

        if (hmac == 'KEY MUST BE IN BYTE INCREMENTS') {
            $('#hmac').append($('<span/>').addClass('label important').append(hmac));
        } else {
            var offset = hex2dec(hmac.substring(hmac.length - 1));
            var part1 = hmac.substr(0, offset * 2);
            var part2 = hmac.substr(offset * 2, 8);
            var part3 = hmac.substr(offset * 2 + 8, hmac.length - offset);
            if (part1.length > 0 ) $('#hmac').append($('<span/>').addClass('label label-default').append(part1));
            $('#hmac').append($('<span/>').addClass('label label-primary').append(part2));
            if (part3.length > 0) $('#hmac').append($('<span/>').addClass('label label-default').append(part3));
        }

        var otp = (hex2dec(hmac.substr(offset * 2, 8)) & hex2dec('7fffffff')) + '';
        otp = (otp).substr(otp.length - 6, 6);

        $('#otp').text(otp);
    }

function timer()
{
    var epoch = Math.round(new Date().getTime() / 1000.0);
    var countDown = 30 - (epoch % 30);
    if (epoch % 30 == 0) updateOtp();
    $('#updatingIn').text(countDown);
    var percentage = countDown * (100/30);
    percentage = Math.round(percentage)
    percentage = 100 - percentage
    //console.log(percentage);
    $(".progress-bar-fill").attr('style', 'width: '+ percentage +'%');
    
}

function startAuthenticator() {
        var secret = $(".newSecret").val();
        if (secret) {
	        updateOtp();

	        $('#update').click(function (event) {
	            updateOtp();
	            event.preventDefault();
	        });

	        $('#secret').keyup(function () {
	            updateOtp();
	        });
	        
	        setInterval(timer, 1000);
  			$(".page").hide();
  			$("#pag_otp").show();

        } else {
        	alert('invalid secret')
        }

};
