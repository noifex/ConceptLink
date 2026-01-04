
export type Word={
    id:number;
    conceptId:number;
    word:string;
    language:string;
    nuance?:string;
    ipa?:string;
};

export type Concept={
    id:number;
    notes?:string;
    words:Word[];
}