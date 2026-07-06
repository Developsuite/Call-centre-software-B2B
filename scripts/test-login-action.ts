import { login } from '../src/app/login/actions';
import { FormData } from 'undici';

async function testLogin() {
  const fd = new FormData();
  fd.append('email', 'zaman@gmail.com');
  fd.append('password', '123456');

  try {
    await login(fd as any);
    console.log("Login succeeded without error");
  } catch (err: any) {
    if (err.message === 'NEXT_REDIRECT') {
      console.log("Login successfully threw a redirect!");
    } else {
      console.log("Login crashed with error:", err.message, err.stack);
    }
  }
}

testLogin();
