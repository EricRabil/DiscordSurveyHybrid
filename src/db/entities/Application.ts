import { Entity, BaseEntity, PrimaryGeneratedColumn, Column } from "typeorm";

export class Field {
    @Column()
    prompt: string;

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