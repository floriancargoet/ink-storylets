import * as inkjs_engine_Path from 'inkjs/engine/Path';
import { Story } from 'inkjs/engine/Story';
import { Container } from 'inkjs/engine/Container';

declare class Storylet {
    story: Story;
    knot: Container;
    categories: Array<string>;
    contentStitch: Container | undefined;
    static tryCreate(story: Story, knot: Container): Storylet | undefined;
    constructor(story: Story, knot: Container, categories: Array<string>);
    toJSON(): {
        name: string | null;
        categories: string[];
        open: boolean;
        exclusivity: number;
        urgency: number;
        frequency: number;
    };
    getStitch(name: string): Container | undefined;
    get<T>(propName: string, defaultValue: T): T;
    get open(): boolean;
    get exclusivity(): number;
    get urgency(): number;
    get frequency(): number;
    get isValid(): boolean;
    get divert(): inkjs_engine_Path.Path | undefined;
}

declare class Storylets {
    story: Story;
    nullDivert: inkjs_engine_Path.Path;
    storylets: Storylet[];
    iterable: IterableIterator<Storylet> | null;
    constructor(story: Story);
    fetchStorylets(): Storylet[];
    fetchNullDivert(): inkjs_engine_Path.Path;
    bindExternalFunctions(): void;
    select(selectQuery: string): void;
    getNext(): inkjs_engine_Path.Path;
    getProp(storyletName: string, propName: string, defaultValue: any): unknown;
}

declare class StoryletsDebugger {
    instance: Storylets;
    constructor(storylets: Storylets);
    get(name: string, asInstance?: boolean): Storylet | {
        name: string | null;
        categories: string[];
        open: boolean;
        exclusivity: number;
        urgency: number;
        frequency: number;
    } | undefined;
    all(asInstances?: boolean): Storylet[] | {
        name: string | null;
        categories: string[];
        open: boolean;
        exclusivity: number;
        urgency: number;
        frequency: number;
    }[];
    select(selectQuery: string, asInstances?: boolean): Storylet[] | {
        name: string | null;
        categories: string[];
        open: boolean;
        exclusivity: number;
        urgency: number;
        frequency: number;
    }[];
}

export { Storylets, StoryletsDebugger };
