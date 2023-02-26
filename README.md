# nse_holidays
This repo is of an npm package. Which helps in checking whether today is a holiday or trading day of NSE India

Usage

const {isTodayHoliday} = require("nse_holidays");

async function check(){
  return await isTodayHoliday();
} //returns an object {isHoliday:true,Holiday:"Republic Day"} or {isHoliday:false,Holiday:"no holiday"}

# Note

isTodayHoliday() //return a promise which resolves into an object try enclosing 'isTodayHoliday()' inside a async function
