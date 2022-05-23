export default class IconJar {
    private readonly EXT;
    private readonly VERSION;
    private readonly GZ_COMPRESSION_LEVEL;
    /**
     * @var undefined|string
     */
    name: undefined | string;
    /**
     * @var Array<IconGroup|IconSet>
     */
    protected children: Array<IconGroup | IconSet>;
    /**
     * @var array
     */
    protected groups: Record<string, never>;
    /**
     * @var array
     */
    protected sets: Record<string, never>;
    /**
     * @var array
     */
    protected icons: Record<string, never>;
    /**
     * @var array
     */
    protected licenses: Record<string, never>;
    /**
     * @var undefined|string
     */
    protected saveLocation: undefined | string;
    /**
     * IconJar constructor.
     *
     * @param                          name
     * @param Array<IconGroup|IconSet> children
     */
    constructor(name: string, children?: Array<IconGroup | IconSet>);
    /**
     * @param IconSet set
     *
     * @return this
     */
    addSet(set: IconSet): this;
    /**
     * @param IconGroup group
     *
     * @return this
     */
    addGroup(group: IconGroup): this;
    /**
     * @param IconGroup|IconSet object
     */
    protected isGroup(object: IconGroup | IconSet): object is IconGroup;
    /**
     * @param IconGroup|IconSet object
     */
    protected isSet(object: IconGroup | IconSet): object is IconSet;
    /**
     * @param array children
     */
    protected compileArray(children: Array<IconGroup | IconSet>): void;
    protected compileSet(set: IconSet): void;
    /**
     * @param Icon icon
     *
     * @return string
     * @throws CopyFile
     * @throws CopyFileException
     * @throws DimensionsException
     */
    protected compileIcon(icon: Icon): string;
    /**
     * @param License license
     *
     * @return null|string
     */
    protected compileLicense(license: License): string;
    /**
     * @param IconGroup group
     *
     * @return null|string
     */
    protected compileGroup(group: IconGroup): string;
    /**
     * @param pathToSave
     *
     * @return string
     * @throws CreationException
     */
    save(pathToSave: any): string;
}
export declare class Icon {
    static readonly TYPE_UNKNOWN = -1;
    static readonly TYPE_SVG = 0;
    static readonly TYPE_PNG = 1;
    static readonly TYPE_GIF = 2;
    static readonly TYPE_PDF = 3;
    static readonly TYPE_ICNS = 4;
    static readonly TYPE_WEBP = 5;
    static readonly TYPE_ICO = 6;
    /**
     * @var undefined|string
     */
    filePath: undefined | string;
    /**
     * @var undefined|string
     */
    file: undefined | string;
    /**
     * @var undefined|string
     */
    name: undefined | string;
    /**
     * @var undefined|string
     */
    identifier: undefined | string;
    /**
     * @var undefined|string
     */
    description: undefined | string;
    /**
     * @var undefined|License
     */
    license: undefined | License;
    /**
     * @var number
     */
    type: number;
    /**
     * @var string[]
     */
    tags: string[];
    /**
     * @var number
     */
    width: number;
    /**
     * @var number
     */
    height: number;
    /**
     * @var undefined|Date
     */
    date: undefined | Date;
    /**
     * @var undefined|string
     */
    unicode: undefined | string;
    /**
     * @var undefined|Set
     */
    set: undefined | IconSet;
    /**
     * Icon constructor.
     *
     * @param string name
     * @param string fileOnDisk
     * @param number type
     */
    constructor(name: string, fileOnDisk: string, type?: number);
    /**
     * @param file
     *
     * @return number
     */
    static getType(file: any): 1 | -1 | 0 | 2 | 3 | 4 | 5 | 6;
    /**
     * @param string tag
     *
     * @return this
     */
    addTag(tag: string): this;
    /**
     * @param string[] tags
     *
     * @return this
     */
    addTags(tags: string[]): this;
    /**
     * @return string
     */
    tagsString(): string;
    /**
     * @throws InvalidTypeException
     * @throws DimensionsException
     */
    validate(): void;
}
export declare class IconGroup {
    /**
     * @var Array<IconGroup|IconSet>
     */
    protected children: Array<IconGroup | IconSet>;
    /**
     * @var undefined|string
     */
    name: undefined | string;
    /**
     * @var undefined|string
     */
    identifier: undefined | string;
    /**
     * @var undefined|string
     */
    description: undefined | string;
    /**
     * @var undefined|Group
     */
    group: undefined | IconGroup;
    /**
     * @var number
     */
    sort: number;
    /**
     * Group constructor.
     *
     * @param string           name
     * @param Array<IconGroup|IconSet> children
     */
    constructor(name?: string, children?: Array<IconGroup | IconSet>);
    /**
     * @param Set set
     *
     * @return this
     */
    addSet(set: IconSet): this;
    /**
     * @param Group group
     *
     * @return this
     */
    addGroup(group: IconGroup): this;
    /**
     * @return Array<Group|Set>
     */
    getChildren(): (IconGroup | IconSet)[];
}
export declare class IconSet {
    /**
     * @var Array<Icon>
     */
    icons: Icon[];
    /**
     * @var undefined|string
     */
    name: undefined | string;
    /**
     * @var undefined|string
     */
    identifier: undefined | string;
    /**
     * @var undefined|string
     */
    description: undefined | string;
    /**
     * @var undefined|License
     */
    license: undefined | License;
    /**
     * @var undefined|Date
     */
    date: undefined | Date;
    /**
     * @var undefined|Group
     */
    group: undefined | IconGroup;
    /**
     * @var number
     */
    sort: number;
    /**
     * Set constructor.
     *
     * @param string name
     * @param Array<Icon>
     */
    constructor(name?: string, icons?: Array<Icon>);
    /**
     * @param Icon icon
     *
     * @return this
     */
    addIcon(icon: Icon): this;
}
export declare class License {
    /**
     * @var undefined|string
     */
    name: undefined | string;
    /**
     * @var undefined|string
     */
    url: undefined | string;
    /**
     * @var undefined|string
     */
    description: undefined | string;
    /**
     * @var undefined|string
     */
    identifier: undefined | string;
    /**
     * License constructor.
     *
     * @param string name
     */
    constructor(name?: string);
}
export declare class CopyFileException extends Error {
    constructor(message?: string);
}
export declare class CreationException extends Error {
    constructor(message?: string);
}
export declare class DimensionsException extends Error {
    constructor(message?: string);
}
export declare class InvalidTypeException extends Error {
    constructor(message?: string);
}
