import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ObjectIdColumn } from "typeorm";

export class Field {
    @Column()
    prompt: string;

    @ObjectIdColumn()
    id: string;

    @Column()
    type: string;

    @Column()
    response: string | boolean | number;
}

@Entity()
export class Application extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user: string;

    @Column(type => Field)
    responses: Field[];
}