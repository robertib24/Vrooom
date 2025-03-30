import { AbstractControl, ValidationErrors } from '@angular/forms';

export function validatorParola(control: AbstractControl): ValidationErrors | null {
  const parola= control.value as string;
  const literaMare = /[A-Z]/.test(parola);
  const literaMica = /[a-z]/.test(parola);
  const numar = /[0-9]/.test(parola);
  const caracterSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(parola);

  if (!literaMare || !literaMica || !numar || !caracterSpecial || parola.length < 8) {
    return { parolaInvalida: true };
  }

  return null;
}

export function validatorVarsta(control: AbstractControl): ValidationErrors | null {
  const dataNasterii = new Date(control.value);
  const dataAzi = new Date();
  let varsta = dataAzi.getFullYear() - dataNasterii.getFullYear();
  const m = dataAzi.getMonth() - dataNasterii.getMonth();

  if (m < 0 || (m === 0 && dataAzi.getDate() < dataNasterii.getDate())) {
    varsta--;
  }

  return varsta >= 18 ? null : { minor: true };
}
export function validatorPoza(control: AbstractControl): { [key: string]: any } | null {
  const poza = control.value;
  if (poza) {
    const pozaExtension = poza.name.split('.').pop().toLowerCase();
    const validTypes = ['jpg', 'jpeg', 'png'];
    if (validTypes.indexOf(pozaExtension) < 0) {
      return { 'extensieIncorecta': true };
    }
  }
  return null;
}

export function validatorEmail(control: AbstractControl): ValidationErrors | null {
  const email = control.value as string;
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z]{3,}.[a-zA-Z]{2,}$/;
  return emailPattern.test(email) ? null : { emailInvalid: true };
}