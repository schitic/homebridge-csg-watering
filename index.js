const request = require('request');
const url = require('url');

module.exports = (api) => {
  api.registerAccessory('homebridge-csq-watering', CSGWatering);
};

class CSGWatering {
	constructor(log, config, api) {
		this.log = log;
		this.config = config;
		this.api = api;

		this.Service = this.api.hap.Service;
		this.Characteristic = this.api.hap.Characteristic;

		// extract name from config
		this.name = config.name;
		this.ip = config.ip;
		this.informationService = this.getInformationService();
		this.sprinklerService = this.getSprinklerService();
  	}

  	getInformationService() {
		const accessoryInformation = new Service.AccessoryInformation()
		.setCharacteristic(Characteristic.Manufacturer, 'ChiticStefan')
		.setCharacteristic(Characteristic.Model, 'WateringSystem')
		.setCharacteristic(Characteristic.FirmwareRevision, "0.0.1");
		.setCharacteristic(Characteristic.SerialNumber, '123-456-789');
		return accessoryInformation;
	}

	getServices() {
      const services = [
        this.informationService,
        this.sprinklerService
      ];
      return services.filter(Boolean);
    }

	getSprinklerService() {
		const sprinklerService = new Service.IrrigationSystem(this.name);

		//sprinklerService.getCharacteristic(Characteristic.Active).setValue(this.isActive, undefined);
		//sprinklerService.getCharacteristic(Characteristic.InUse).setValue(this.isInUse, undefined);
		//sprinklerService.getCharacteristic(Characteristic.ProgramMode).setValue(this.ProgramMode, undefined);

		//sprinklerService.getCharacteristic(Characteristic.RemainingDuration)
		//.on('get', this.getRemainingDuration.bind(this));

		sprinklerService.getCharacteristic(Characteristic.Active)
		.on('get', this.getActive.bind(this))
		.on('set', this.setActive.bind(this))

		sprinklerService.getCharacteristic(Characteristic.InUse)
		.on('get', this.getInUse.bind(this))

		sprinklerService.getCharacteristic(this.Characteristic.ProgramMode)
		.on('get', this.getProgramModeGet.bind(this));

		return sprinklerService;
    }

    setActive(value, callback) {
    	const me = this;
		request({
	      url: me.ip + '/api/inUse',
		  body: {'targetState': value},
		  method: 'POST',
		  headers: {'Content-type': 'application/json'}
		},
		function (error, response) {
		  if (error) {
		    me.log('STATUS: ' + response.statusCode);
		    me.log(error.message);
		    return callback(error);
		  }
		  return callback(null);
		});
  	}

    getInUse(callback) {
		const me = this;
	    request({
	      url: me.ip + '/api/inUse',
	      method: 'GET',
	    },
	    function (error, response, body) {
	      if (error) {
	        me.log('STATUS: ' + response.statusCode);
	        me.log(error.message);
	        return callback(error);
	      }
	      if(body.currentState === "running")
	      	return callback(null, Characteristic.InUse.IN_USE);
	      return callback(null, Characteristic.InUse.NOT_IN_USE);
	    });
	}

	getProgramModeGet(callback) {
		const me = this;
	    request({
	      url: me.ip + '/api/inUse',
	      method: 'GET',
	    },
	    function (error, response, body) {
	      if (error) {
	        me.log('STATUS: ' + response.statusCode);
	        me.log(error.message);
	        return callback(error);
	      }
	      if(body.forced_start === true)
	      	return callback(null, Characteristic.ProgramMode.PROGRAM_SCHEDULED);
	      return callback(null, Characteristic.ProgramMode.PROGRAM_SCHEDULED_MANUAL_MODE_);
	    });
	}

	getActive(callback) {
		const me = this;
	    request({
	      url: me.ip + '/api/inUse',
	      method: 'GET',
	    },
	    function (error, response, body) {
	      if (error) {
	        me.log('STATUS: ' + response.statusCode);
	        me.log(error.message);
	        return callback(error);
	      }
	      if(body.currentState === "running")
	      	return callback(null, Characteristic.Active.ACTIVE);
	      return callback(null, Characteristic.Active.INACTIVE);
	    });
	}
}

