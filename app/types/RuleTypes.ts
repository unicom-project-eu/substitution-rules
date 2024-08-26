export type Substance = {
    code: string;
    display: string;
    group?: string;
};

export type Rule = {
    id: number;
    name: string;
    substanceCodes: string[];
    parentCode: string;
};