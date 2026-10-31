export function validatePasswordChange(current:string,next:string,confirmation:string):string|null{
 if(!current||!next||!confirmation)return 'Заполните все поля.';
 if(next.length<4)return 'Новый пароль должен содержать не менее 4 символов.';
 if(next!==confirmation)return 'Новый пароль и подтверждение не совпадают.';
 if(current===next)return 'Новый пароль должен отличаться от текущего.';
 return null;
}
