var batterySample = {
  0:{
      battery: 255,
      status: ['CRITICAL','UNASSIGNED','RX_COM_ERROR','TX_COM_ERROR']
    },
  1:{
      battery: 1,
      status: ['CRITICAL']
    },
  2:{
      battery: 2,
      status: ['CRITICAL']
    },
  3:{
      battery: 3,
      status: ['REPLACE','PREV_REPLACE']
    },
  4:{
      battery: 4,
      status: ['GOOD','PREV_GOOD','UNASSIGNED']
    },
  5:{
      battery: 5,
      status: ['GOOD','PREV_GOOD']
    }
}

var rfSample = ['AX','XB','XX','BRXX','XRXB','XXBR'];


var name_sample = ['Fatai','Marshall','Delwin','Tracy TB','Backup',
                   'Steve','JE','Sharon','Bob','Del ACU','Troy',
                   'Matt','Matt ACU','Matt Sax','Karl','Jordan','Josue',
                   'Hallie','Rebekah','Dan','Stephen','Max','Tom','Nick',''];

var prefix_sample = ['HH','BP'];

var type_sample = ['ULXD','QLXD','ULXD','AXTD']

function randomIPGenerator() {
  return "192.168.103." + getRandomInt(50,150)
}

function randomTypeGenerator() {
    return type_sample[getRandomInt(0,type_sample.length - 1)]
}

// https://gist.github.com/kerimdzhanov/7529623
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomNameGenerator(){
  var prefix = prefix_sample[getRandomInt(0,1)];
  var channel = getRandomInt(1,16).toString().padStart(2,'0');

  var len = name_sample.length;
  var index = getRandomInt(0,len-1);
  var name = name_sample[index]
  return prefix + channel + ' ' + name;
}

function current_names() {
  var names = []
  var slots = Object.keys(transmitters).map(Number);

  for(i in slots){
    name = transmitters[slots[i]].name
    prefix = name.substring(0,2)
    number = name.substring(2,4)
    name = name.substring(5)
    names.push(name)
  }
  return names
}

function uniqueRandomNameGenerator(slot){
  var used_names = current_names()
  namebank = name_sample.filter( el => !used_names.includes(el));

  var len = namebank.length;
  var index = getRandomInt(0,len-1);
  var name = namebank[index]


  var channel = slot.toString().padStart(2,'0');
  output = 'HH' + channel + ' ' + name;
  console.log(output)
  return output
}

function randomRfSampleGenerator() {
  return rfSample[getRandomInt(0,5)];
}

function randomAudioGenerator(){
  return getRandomInt(0,30);
}

function randomTXOffsetGenerator() {
  return getRandomInt(0,21);
}

function randomFrequencyGenerator(){
  frequency =  getRandomInt(474,597) + (getRandomInt(0,40) * .025)
  return frequency.toFixed(3)
}

function randomRfGenerator(){
  return getRandomInt(0,50);
}

function randomBatteryGenerator() {
  var batt_index = getRandomInt(0,5);
  var battery = batterySample[batt_index];
  var len = battery.status.length;
  var status_index = getRandomInt(0,len-1);

  var res = {
              battery: battery.battery,
              status: battery.status[status_index]
            }
  return res;
}

function randomDataGenerator(slot){
  var battery = randomBatteryGenerator();

  var res = {
    "name": uniqueRandomNameGenerator(slot),
    "antenna": randomRfSampleGenerator(),
    "audio_level": randomAudioGenerator(),
    "rf_level": randomRfGenerator(),
    "tx_offset": randomTXOffsetGenerator(),
    "frequency": randomFrequencyGenerator(),
    "slot": slot,
    "battery": battery.battery,
    "status": battery.status,
    "ip": randomIPGenerator(),
    "channel": getRandomInt(1,4),
    "type": randomTypeGenerator()
  }
  return res;

}

function meteteredRandomDataGenerator(update){
  var slots = Object.keys(transmitters).map(Number);
  var slot = slots[getRandomInt(0, slots.length - 1)];
  data = JSON.parse(JSON.stringify(transmitters[slot]))

  var battery = randomBatteryGenerator();

  switch(update){
    case "name":        data["name"] = uniqueRandomNameGenerator(slot)
                        break;
    case "antenna":     data["antenna"] = randomRfSampleGenerator()
                        break;
    case "tx_offset":   data["tx_offset"] = randomTXOffsetGenerator()
                        break;
    case "frequency":   data["frequency"] = randomFrequencyGenerator()
                        break;
    case "battery":
    case "status":      data["battery"] = battery.battery
                        data["status"] = battery.status
                        break

  }
  return data;

}



function randomCharts(){
  var slots = Object.keys(transmitters).map(Number);
  slots.forEach(function(slot){
    charts[slot].audioSeries.append(Date.now(), randomAudioGenerator());
    charts[slot].rfSeries.append(Date.now(), randomRfGenerator());
  })
}


function autoRandom(){
  setInterval(function(){
    updateSlot(meteteredRandomDataGenerator("name"));
  },1250)

  setInterval( function () {
    updateSlot(meteteredRandomDataGenerator("antenna"))
  },90)

  setInterval(function(){
    updateSlot(meteteredRandomDataGenerator("battery"))
  },1250)

  setInterval(function(){
    updateSlot(meteteredRandomDataGenerator("tx_offset"))
  },750)

  setInterval(function(){
    updateSlot(meteteredRandomDataGenerator("frequency"))
  },750)

  setInterval(randomCharts,125);
}
