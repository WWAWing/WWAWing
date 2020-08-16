export interface Copyright {
    range: {
        firstYear: number;
        lastYear: number;
    };
    credit: string;
    product: {
        genre?: string;
        name: string;
        href: string;
    };
}

export type BuiltInCopyright = "official-only" | "official-and-wing";

