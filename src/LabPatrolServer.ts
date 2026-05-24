import BackendServer from "./BackendServer"
import {Context} from 'koa'
import  logger from './logger.js'
import {LabDataFetch} from "./LabDataFetch"
import {TableSchema} from "./DataStore"
import { DBType } from "./LabPatrolPub"
import {DiagLldpConn, DiagLldpNode} from "./DiagPub"
import {AxosLocationHistory} from "./AxosLocationHistory"

type FetchResponse = {
    code: number,
    message: {
        totalCount: number,
        resCount:number,
        res:TableSchema[]
    }
}

type FetchTopoResponse = {
    code: number,
    message: {
        totalCount: number,
        resCount:number,
        res:DiagLldpNode[]
    }
}

class LabPatrolServer extends BackendServer {
    labData:LabDataFetch|undefined;
    eachFetch:number = 100
    constructor(port:number) {
        super(port)
    }

    async loadTableInfo() {
        this.labData = new LabDataFetch()
        await this.labData.openDb('../labpatrol/labpatrol.db')


    }

    async queryData(dbType: number, filter: string):Promise<TableSchema[]> {
        let rows:TableSchema[] = []
        switch(dbType) {
            case DBType.DBType_AXOS_CARD:
                rows = await this.labData?.queryAxosCard() as TableSchema[]
                break;
            case DBType.DBType_EXA_CARD:
                rows = await this.labData?.queryExaCard() as TableSchema[]
                break;
            case DBType.DBType_AXOS_ONT:
                rows = await this.labData?.queryAxosOnt() as TableSchema []
                break;
            case DBType.DBType_EXA_ONT:
                rows = await this.labData?.queryExaOnt() as TableSchema[]
                break;
            case DBType.DBType_EXA_MODULE:
                rows = await this.labData?.queryExaModule() as TableSchema[]
                break;    
            case DBType.DBType_AXOS_MODULE:
                rows = await this.labData?.queryAxosModule() as TableSchema[]
                break;       
            case DBType.DBType_AXOS_LLDP:
                rows = await this.labData?.queryAxosLldp() as TableSchema[]
                break;                  
            case DBType.DBType_EXA_LLDP:
                rows = await this.labData?.queryExaLldp() as TableSchema[]
                break;                  
        }

        if (filter === '') {
            return rows
        }
        let filterRow:TableSchema[] = []
        for (let ii = 0; ii < rows.length; ii++) {
            for (let key in rows[ii]) {
                if (rows[ii][key].toLowerCase().indexOf(filter.toLowerCase()) != -1) {
                    filterRow.push(rows[ii])
                    break
                }
            }
        }
        return filterRow
    }

    async init() {
        let that = this;
        await this.loadTableInfo()
        // http://127.0.0.1:3721/exacard?pageNum=1&eachFetch=50
        let fetchExaCallBack = async function (ctx:Context, next:any) {
            ctx.status = 200;
            let ctxQuery = ctx.query;
            let startIdx = 0;
            let eachFetch = that.eachFetch;
            let filter = ''
            // console.log(ctx)
            if (ctxQuery.eachFetch) {
                eachFetch = +ctxQuery.eachFetch;
            }
            // start from 0
            if (ctxQuery.pageNum) {
                startIdx = (+ctxQuery.pageNum - 1) * eachFetch;
            }

            if (ctxQuery.filter) {
                filter = ctxQuery.filter as string
            }

            ctx.set('Content-Type', 'application/json')
            ctx.set("Access-Control-Allow-Origin", "*");
            try {
                // let result = await this.login.run(data) || {}

                let rows = await that.queryData(DBType.DBType_EXA_CARD, filter) as TableSchema[]
                let res:TableSchema[] =[]
                let resCount = 0;
                let totalCount = 0;
                if (rows && rows.length > 0 && startIdx < rows.length){
                    totalCount = rows.length
                    for (let jj = startIdx; jj < startIdx + eachFetch && jj < rows.length; jj++) {
                        res.push(rows[jj])
                        resCount++;
                    }
                }
                let result:FetchResponse = {
                    code:200, 
                    message: {
                        totalCount: totalCount,
                        resCount:resCount,
                        res:res
                    }
                }
                // ctx.set('set-cookie', _.get(result, 'cookies', []).map(cookie => typeof (cookie) === 'string' ? cookie : `${cookie.name}=${cookie.value}`).join('; '))
                ctx.response.body = result;
            } catch (e) {
                logger.error('error handle fetch get')
            }
        }
        this.registRouteCall({ type: 'get', route: '/exacard', callBack: fetchExaCallBack })

        let fetchAxosCallBack = async function (ctx:Context, next:any) {
            ctx.status = 200;
            let ctxQuery = ctx.query;
            let startIdx = 0;
            let eachFetch = that.eachFetch;
            let filter = ''
            // console.log(ctx)
            if (ctxQuery.eachFetch) {
                eachFetch = +ctxQuery.eachFetch;
            }
            // start from 0
            if (ctxQuery.pageNum) {
                startIdx = (+ctxQuery.pageNum - 1) * eachFetch;
            }

            if (ctxQuery.filter) {
                filter = ctxQuery.filter as string
            }
            ctx.set('Content-Type', 'application/json')
            ctx.set("Access-Control-Allow-Origin", "*");
            try {
                // let result = await this.login.run(data) || {}

                let rows = await that.queryData(DBType.DBType_AXOS_CARD, filter) as TableSchema[]
                let res:TableSchema[] =[]
                let resCount = 0;
                let totalCount = 0;
                if (rows && rows.length > 0 && startIdx < rows.length){
                    totalCount = rows.length
                    for (let jj = startIdx; jj < startIdx + eachFetch && jj < rows.length; jj++) {
                        res.push(rows[jj])
                        resCount++;
                    }
                }
                let result:FetchResponse = {
                    code:200, 
                    message: {
                        totalCount: totalCount,
                        resCount:resCount,
                        res:res
                    }
                }
                // ctx.set('set-cookie', _.get(result, 'cookies', []).map(cookie => typeof (cookie) === 'string' ? cookie : `${cookie.name}=${cookie.value}`).join('; '))
                ctx.response.body = result;
            } catch (e) {
                logger.error('error handle fetch get')
            }
        }
        this.registRouteCall({ type: 'get', route: '/axoscard', callBack: fetchAxosCallBack })  

        let fetchExaOntCallBack = async function (ctx:Context, next:any) {
            ctx.status = 200;
            let ctxQuery = ctx.query;
            let startIdx = 0;
            let eachFetch = that.eachFetch;
            let filter = ''
            // console.log(ctx)
            if (ctxQuery.eachFetch) {
                eachFetch = +ctxQuery.eachFetch;
            }
            // start from 0
            if (ctxQuery.pageNum) {
                startIdx = (+ctxQuery.pageNum - 1) * eachFetch;
            }

            if (ctxQuery.filter) {
                filter = ctxQuery.filter as string
            }
            
            ctx.set('Content-Type', 'application/json')
            ctx.set("Access-Control-Allow-Origin", "*");
            try {
                // let result = await this.login.run(data) || {}

                let rows = await that.queryData(DBType.DBType_EXA_ONT, filter) as TableSchema[]
 
                let res:TableSchema[] =[]
                let resCount = 0;
                let totalCount = 0;
                if (rows && rows.length > 0 && startIdx < rows.length){
                    totalCount = rows.length
                    for (let jj = startIdx; jj < startIdx + eachFetch && jj < rows.length; jj++) {
                        res.push(rows[jj])
                        resCount++;
                    }
                }
                let result:FetchResponse = {
                    code:200, 
                    message: {
                        totalCount: totalCount,
                        resCount:resCount,
                        res:res
                    }
                }
                // ctx.set('set-cookie', _.get(result, 'cookies', []).map(cookie => typeof (cookie) === 'string' ? cookie : `${cookie.name}=${cookie.value}`).join('; '))
                ctx.response.body = result;
            } catch (e) {
                logger.error('error handle fetch get')
            }
        }

        this.registRouteCall({ type: 'get', route: '/exaont', callBack: fetchExaOntCallBack }) 

        let fetchAxosOntCallBack = async function (ctx:Context, next:any) {
            ctx.status = 200;
            let ctxQuery = ctx.query;
            let startIdx = 0;
            let eachFetch = that.eachFetch;
            let filter = ''

            if (ctxQuery.eachFetch) {
                eachFetch = +ctxQuery.eachFetch;
            }
            // start from 0
            if (ctxQuery.pageNum) {
                startIdx = (+ctxQuery.pageNum - 1) * eachFetch;
            }

            if (ctxQuery.filter) {
                filter = ctxQuery.filter as string
            }
            ctx.set('Content-Type', 'application/json')
            ctx.set("Access-Control-Allow-Origin", "*");
            try {
                // let result = await this.login.run(data) || {}
                let rows = await that.queryData(DBType.DBType_AXOS_ONT, filter) as TableSchema[]
 
                let res:TableSchema[] =[]
                let resCount = 0;
                let totalCount = 0;
                if (rows && rows.length > 0 && startIdx < rows.length){
                    totalCount = rows.length
                    for (let jj = startIdx; jj < startIdx + eachFetch && jj < rows.length; jj++) {
                        res.push(rows[jj])
                        resCount++;
                    }
                }
                let result:FetchResponse = {
                    code:200, 
                    message: {
                        totalCount: totalCount,
                        resCount:resCount,
                        res:res
                    }
                }
                // ctx.set('set-cookie', _.get(result, 'cookies', []).map(cookie => typeof (cookie) === 'string' ? cookie : `${cookie.name}=${cookie.value}`).join('; '))
                ctx.response.body = result;
            } catch (e) {
                logger.error('error handle fetch get')
            }
        }

        this.registRouteCall({ type: 'get', route: '/axosont', callBack: fetchAxosOntCallBack }) 

        let fetchCommonCallBack = async function (ctx:Context, next:any) {
            ctx.status = 200;
            let ctxQuery = ctx.query;
            let startIdx = 0;
            let eachFetch = that.eachFetch;
            let filter = ''
            if (ctxQuery.eachFetch) {
                eachFetch = +ctxQuery.eachFetch;
            }
            // start from 0
            if (ctxQuery.pageNum) {
                startIdx = (+ctxQuery.pageNum - 1) * eachFetch;
            }

            if (ctxQuery.filter) {
                filter = ctxQuery.filter as string
            }
            ctx.set('Content-Type', 'application/json')
            ctx.set("Access-Control-Allow-Origin", "*");
            try {
                let dbType = DBType.DBType_AXOS_MODULE
                if (ctx.request.url) {
                    if (ctx.request.url.toLowerCase().indexOf('axosmodule') != -1) {
                        dbType = DBType.DBType_AXOS_MODULE
                    }else if (ctx.request.url.toLowerCase().indexOf('examodule') != -1) {
                        dbType = DBType.DBType_EXA_MODULE
                    }
                }

                // let result = await this.login.run(data) || {}
                let rows = await that.queryData(dbType, filter) as TableSchema[]
 
                let res:TableSchema[] =[]
                let resCount = 0;
                let totalCount = 0;
                if (rows && rows.length > 0 && startIdx < rows.length){
                    totalCount = rows.length
                    for (let jj = startIdx; jj < startIdx + eachFetch && jj < rows.length; jj++) {
                        res.push(rows[jj])
                        resCount++;
                    }
                }
                let result:FetchResponse = {
                    code:200, 
                    message: {
                        totalCount: totalCount,
                        resCount:resCount,
                        res:res
                    }
                }
                // ctx.set('set-cookie', _.get(result, 'cookies', []).map(cookie => typeof (cookie) === 'string' ? cookie : `${cookie.name}=${cookie.value}`).join('; '))
                ctx.response.body = result;
            } catch (e) {
                logger.error('error handle fetch get')
            }
        }
        this.registRouteCall({ type: 'get', route: '/axosmodule', callBack: fetchCommonCallBack }) 
        this.registRouteCall({ type: 'get', route: '/examodule', callBack: fetchCommonCallBack }) 
        let updateCheckCallBack = async function (ctx:Context, next:any) {
            ctx.status = 200;
            let response = {}

            let data = ctx.request.body

            ctx.set('Content-Type', 'application/json')
            ctx.set("Access-Control-Allow-Origin", "*");
            try {

                ctx.response.body = response;
            } catch (e) {
                logger.error('error handle record update')
            }
        }

        this.registRouteCall({ type: 'post', route: '/update', callBack: updateCheckCallBack })

        let fetchCommonIpCallBack = async function (ctx:Context, next:any) {
            ctx.status = 200;
            let ctxQuery = ctx.query;
            let filter = ''

            if (ctxQuery.filter) {
                filter = ctxQuery.filter as string
            }
            ctx.set('Content-Type', 'application/json')
            ctx.set("Access-Control-Allow-Origin", "*");
            try {
                let dbType = DBType.DBType_AXOS_MODULE
                if (ctx.request.url) {
                    if (ctx.request.url.toLowerCase().indexOf('axosmoduleip') != -1) {
                        dbType = DBType.DBType_AXOS_MODULE
                    }else if (ctx.request.url.toLowerCase().indexOf('examoduleip') != -1) {
                        dbType = DBType.DBType_EXA_MODULE
                    }else if (ctx.request.url.toLowerCase().indexOf('axoscardip') != -1) {
                        dbType = DBType.DBType_AXOS_CARD
                    }else if (ctx.request.url.toLowerCase().indexOf('exacardip') != -1) {
                        dbType = DBType.DBType_EXA_CARD
                    }else if (ctx.request.url.toLowerCase().indexOf('axosontip') != -1) {
                        dbType = DBType.DBType_AXOS_ONT
                    }else if (ctx.request.url.toLowerCase().indexOf('exaontip') != -1) {
                        dbType = DBType.DBType_EXA_ONT
                    }
                }

                // let result = await this.login.run(data) || {}
                let rows = await that.queryData(dbType, filter) as TableSchema[]
 
                let res:TableSchema[] =[]
                let totalCount = 0;
                let ipList:string[] = []
                if (rows && rows.length > 0) {
                    totalCount = rows.length
                    for (let jj = 0; jj < rows.length; jj++) {
                        if (ipList.includes(rows[jj]['address'])) {
                            continue
                        }
                        ipList.push(rows[jj]['address'])
                        res.push({'address':rows[jj]['address']})
                    }
                }
                let result:FetchResponse = {
                    code:200, 
                    message: {
                        totalCount: totalCount,
                        resCount:0,
                        res:res
                    }
                }
                // ctx.set('set-cookie', _.get(result, 'cookies', []).map(cookie => typeof (cookie) === 'string' ? cookie : `${cookie.name}=${cookie.value}`).join('; '))
                ctx.response.body = result;
            } catch (e) {
                logger.error('error handle fetch get')
            }
        }
        this.registRouteCall({ type: 'get', route: '/axosmoduleip', callBack: fetchCommonIpCallBack }) 
        this.registRouteCall({ type: 'get', route: '/examoduleip', callBack: fetchCommonIpCallBack }) 
        this.registRouteCall({ type: 'get', route: '/axoscardip', callBack: fetchCommonIpCallBack }) 
        this.registRouteCall({ type: 'get', route: '/exacardip', callBack: fetchCommonIpCallBack }) 
        this.registRouteCall({ type: 'get', route: '/axosontip', callBack: fetchCommonIpCallBack }) 
        this.registRouteCall({ type: 'get', route: '/exaontip', callBack: fetchCommonIpCallBack }) 

        /*
        SHELF ID,SLOT ID,PORT,DEST AGENT,AGENT REFERENCE,SYSTEM NAME TLV,PORT ID TLV,MANAGEMENT ADDRESS TLV,TTL TLV,RX INFO TTL
        1,1,x4,nearest-bridge,1,GPON8-r2,IFN: 1/2/x1,10.245.34.155,121,115
        */
        let fetchAxosTopology = async function (ctx:Context, next:any) {
            ctx.status = 200;
            let ctxQuery = ctx.query;
            let filter = ''

            if (ctxQuery.filter) {
                filter = ctxQuery.filter as string
            }
            ctx.set('Content-Type', 'application/json')
            ctx.set("Access-Control-Allow-Origin", "*");
            try {
                let dbType = DBType.DBType_AXOS_LLDP
                // let result = await this.login.run(data) || {}
                let lldprows = await that.queryData(dbType, filter) as TableSchema[]
                dbType =  DBType.DBType_AXOS_CARD
                let cardRows = await that.queryData(dbType, filter) as TableSchema[]
                
                if (cardRows === undefined || cardRows.length === 0)  {


                }

                let mapLldpInfo = new Map<string, DiagLldpNode>()

                for (let cardNode of cardRows) {
                    if (mapLldpInfo.get(cardNode['address'])=== undefined)  {
                        mapLldpInfo.set(cardNode['address'],{
                            selfIp: cardNode['address'],
                            nodeName: cardNode['address'],
                            conns:[]
                        }) 
                    }
                }

                for (let cardLldp of lldprows) {
                    let lldp = <DiagLldpConn>{}
                    lldp.peerIp = cardLldp['MANAGEMENT ADDRESS TLV']
                    lldp.peerPort = cardLldp['PORT ID TLV']
                    lldp.portSelf = cardLldp['SHELF ID'] + '/' + cardLldp['SLOT ID']  + '/' + cardLldp['PORT']
                    lldp.selfIp = cardLldp['address']
                    let mapFind = mapLldpInfo.get(cardLldp['address']) 
                    if (mapFind === undefined) {
                        mapFind = {
                            selfIp: cardLldp['address'],
                            nodeName: cardLldp['address'],
                            conns:[]
                        }
                    }
                    mapFind.conns.push(lldp)
                }


                let result:FetchTopoResponse = {
                    code:200, 
                    message: {
                        totalCount: mapLldpInfo.size,
                        resCount: mapLldpInfo.size,
                        res:[...mapLldpInfo.values()]
                    }
                }
                // ctx.set('set-cookie', _.get(result, 'cookies', []).map(cookie => typeof (cookie) === 'string' ? cookie : `${cookie.name}=${cookie.value}`).join('; '))
                ctx.response.body = result;
            } catch (e) {
                console.log(e)
                logger.error('error handle fetch get axosTopo')
            }
        }
        this.registRouteCall({ type: 'get', route: '/axostopo', callBack: fetchAxosTopology })

        let fetchLocationHistoryCallBack = (type: 'card' | 'module' | 'ont') => async function (ctx:Context, next:any) {
            ctx.status = 200;
            let ctxQuery = ctx.query;
            let sn = '';
            if (ctxQuery.sn) {
                sn = ctxQuery.sn as string;
            }

            if (!sn) {
                ctx.response.body = {
                    code: 400,
                    message: 'Missing required parameter: sn'
                };
                return;
            }

            ctx.set('Content-Type', 'application/json')
            ctx.set("Access-Control-Allow-Origin", "*");
            try {
                const historyService = new AxosLocationHistory();
                const history = await historyService.getLocationHistory(sn, type);

                let result = {
                    code: 200,
                    message: {
                        totalCount: history.length,
                        res: history
                    }
                };
                ctx.response.body = result;
            } catch (e) {
                logger.error(`error handle fetch ${type} location history`)
                ctx.status = 500;
                ctx.response.body = {
                    code: 500,
                    message: 'Internal server error'
                };
            }
        }
        this.registRouteCall({ type: 'get', route: '/cardlocation', callBack: fetchLocationHistoryCallBack('card') })
        this.registRouteCall({ type: 'get', route: '/modulelocation', callBack: fetchLocationHistoryCallBack('module') })
        this.registRouteCall({ type: 'get', route: '/ontlocation', callBack: fetchLocationHistoryCallBack('ont') })

    }


}
if (__filename === require.main?.filename) {
    (async () => {
        let bkend = new LabPatrolServer(3721)
        await bkend.init();

        await bkend.run();

    })()
}


