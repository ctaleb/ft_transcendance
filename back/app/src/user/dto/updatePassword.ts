import { IsString } from "class-validator";

export class updatePasswordDto {
    @IsString()
    readonly newPassword: string;
}