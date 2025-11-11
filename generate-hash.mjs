import bcrypt from 'bcryptjs';

const password = 'admin123';
bcrypt.hash(password, 10).then(hash => {
  console.log('Hash pour admin123:');
  console.log(hash);
  console.log('\nPour mettre à jour dans la base:');
  console.log(`UPDATE User SET password = '${hash}' WHERE email = 'super@school.local';`);
});
