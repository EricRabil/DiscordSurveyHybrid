import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ObjectIdColumn, CreateDateColumn } from "typeorm";

export class Field {
    @Column()
    prompt: string;

    @ObjectIdColumn()
    id: string;

    @Column()
    type: string;

    @Column()
    formID: string;

    @Column()
    response: string | boolean | number;
}

@Entity()
export class Application extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user: string;

    @Column()
    created: Date = new Date();

    @CreateDateColumn()
    updated: Date;

    @Column(type => Field)
    responses: Field[];
}