import assert from 'node:assert/strict';import test from 'node:test';import {validatePasswordChange} from '../src/auth/password.js';
test('requires every password field',()=>assert.equal(validatePasswordChange('','',''),'Заполните все поля.'));
test('rejects passwords shorter than four characters',()=>assert.match(validatePasswordChange('old','123','123')??'',/не менее 4/));
test('rejects a mismatched confirmation',()=>assert.match(validatePasswordChange('old','1234','4321')??'',/не совпадают/));
test('rejects reuse of the current password',()=>assert.match(validatePasswordChange('same','same','same')??'',/отличаться/));
test('accepts a valid password change',()=>assert.equal(validatePasswordChange('old-password','7591','7591'),null));
