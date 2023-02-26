const request = require("request")
const fs = require("node:fs/promises")
const url = "https://www.nseindia.com/api/holiday-master?type=trading"
let cookie = ""
let last_check = null; // holds last check time stamp 
let last_check_ms_limit = 86400000 // duration to skip is old data check 86400000 is equal to 24hours
let dates_cache = null;

async function getData(){    // gets data from nse api and writes it file



    try{
        let options = {
        method: "get",
        url: url,
        headers:{
            "accept": "*/*",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
            "sec-ch-ua": "\"Not_A Brand\";v=\"99\", \"Google Chrome\";v=\"109\", \"Chromium\";v=\"109\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "cookie": cookie,
            "Referer": "https://www.nseindia.com/resources/exchange-communication-holidays",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        }
    }
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
        let data = await new Promise((resolve,reject)=>{
            return request(options,function(error,response){
                if(error){
                    console.log(error)
                    return reject()
                }
                cookie = response.headers["set-cookie"]
                resolve(JSON.parse(response.body))
            })
        }).catch((err)=>{
            console.warn("nse_holdiays not working currently. please try after sometime")
        })

        let string = ""
        for(let i=0;i<data.CM.length;i++){
            let keys = Object.keys(data.CM[0]).join(",")
            keys += "\n"
            string += keys
            break
        }
        for(let i=0;i<data.CM.length;i++){
            let keys = Object.keys(data.CM[0])
            keys = keys.map((e)=>{
                return data.CM[i][e]
            }).join(",")

            keys+="\n"
            string+=keys
        }

        fs.writeFile("txt.csv",string,{encoding:"utf-8"},(err)=>{
            if(err){
                console.log(err)
            }
        })

        return data.CM.map((e)=>{
            return e.tradingDate
        })

    }catch(err){
        console.log(err)
        return []
    }

}

async function isTodayHoliday(){
    
    try{

        let toDay = new Date()
        if(toDay.getDay()==0 || toDay.getDay()==6){
            return {isHoliday:true,holiday:"Weekend"}
        }
        
        let data_check = await is_data_old()
        
        if(data_check){
            await getData()
        }

        toDay = toDay.toString()
        toDay = toDay.split(" ").filter((e,i)=>{
            if(i>0&&i<4){
                return true
            }
        })

        toDay = [toDay[1],toDay[0],toDay[2]].join("-")
        
        let date_is_in_holiday = await getDates()

        let check_date = await Promise.all(date_is_in_holiday.filter((ele)=>{
            return ele.date==toDay
        }))
        
        if(check_date.length>0){
            return {isHoliday:true,holiday:check_date[0].holiday}
        }

        return {isHoliday:false,holiday:"no holiday"}

    }catch(err){
        console.log(err)
        return null
    }
}



async function getDates(){

    let holdiday_list = await fs.readFile("./txt.csv",{encoding:"utf8"},async(err,data)=>{
            if(err){
                console.log(err)
            }
        }).catch((err)=>{
            return null
        })

        if(!holdiday_list){
            return []
        }

        let raw_data = holdiday_list.split("\n")
        raw_data.shift()
        let dates = await Promise.all(raw_data.map((ele)=>{
            let date_object = ele.split(",")
            return {
                date: date_object[0],
                holiday: date_object[2]
            }
        }))

        dates = dates.filter((ele)=>{
            return new Date(ele.date)!="Invalid Date"
        })

        return dates
}

async function is_data_old(){

    if(last_check){
        if(last_check>=Date.now()-last_check_ms_limit){
            return false
        }
    }

    last_check = Date.now()
    let toDay = new Date().toString()
    toDay = toDay.split(" ").filter((e,i)=>{
        if(i>0&&i<4){
            return true
        }
    })

    toDay = [toDay[1],toDay[0],toDay[2]].join("-")

    let dates = await getDates()
    
    let check_dates = dates.filter((ele)=>{
        return new Date(toDay)>new Date(ele.date)
    })

    if(dates.length==check_dates.length){
        return true
    }
    
    return false
}


async function main(){
    if(await is_data_old()){
        getData()
    }
}


main()


module.exports = {
    isTodayHoliday
}




