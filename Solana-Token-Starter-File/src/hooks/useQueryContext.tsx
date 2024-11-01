import {useRouter} from "next/router";
import{EndpointTypes} from "../models/types";


export default function useQueryContext(){
    const router = useRouter();
    const {cluster} = router.query;

    const endpoin = cluster ? (cluster as EndpointTypes) : "mainnet";
    const hasClusterOption = endpoin !== "mainnet";

    const fmUrlWithCluster = (url) => {
        if(hasClusterOption){
            const mark = url.includes("?") ? "&" :"?"
            return decodeURIComponent(`${url}${mark}cluster${endpoin}`);

        }
        return url;
    

    };
    return{
        fmUrlWithCluster,
    } ;
};