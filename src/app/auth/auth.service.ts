import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { MsalService } from '@azure/msal-angular';
import { AuthenticationResult } from '@azure/msal-browser';
import { environment } from '../../environments/environment';

export interface UserProfile {
  username: string;
  name: string;
  email: string;
  role: 'Admin' | 'Funcionario' | 'Vecino' | 'Auditor' | string;
  token: string;
  isMicrosoftAuth: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private msalService: MsalService,
    private http: HttpClient,
    private router: Router
  ) {
    this.restoreSession();
  }

  private restoreSession(): void {
    const saved = localStorage.getItem('barriodigital_user');
    if (saved) {
      try {
        const user = JSON.parse(saved) as UserProfile;
        this.currentUserSubject.next(user);
      } catch (e) {
        localStorage.removeItem('barriodigital_user');
      }
    }
  }

  public async loginWithMicrosoft(): Promise<UserProfile> {
    try {
      const result: AuthenticationResult = await firstValueFrom(
        this.msalService.loginPopup({
          scopes: environment.azure.scopes
        })
      );

      const claims = result.idTokenClaims as Record<string, any>;
      let role = 'Vecino';
      if (claims['roles'] && Array.isArray(claims['roles']) && claims['roles'].length > 0) {
        role = claims['roles'][0];
      }

      const user: UserProfile = {
        username: result.account?.username || 'usuario@duocuc.cl',
        name: result.account?.name || 'Usuario Microsoft',
        email: result.account?.username || 'usuario@duocuc.cl',
        role: role,
        token: result.accessToken,
        isMicrosoftAuth: true
      };

      this.setCurrentUser(user);
      return user;
    } catch (error) {
      console.error('Error durante autenticación con Microsoft Azure AD:', error);
      throw error;
    }
  }

  public async loginWithDemoRole(role: string, name?: string, email?: string): Promise<UserProfile> {
    const defaultNames: Record<string, string> = {
      Admin: 'Carlos Valenzuela (Administrador Municipal)',
      Funcionario: 'Mariana Soto (Operadora de Servicios)',
      Vecino: 'Pedro Araya (Vecino Barrio Centro)',
      Auditor: 'Lorena Contreras (Auditora de Transparencia)'
    };

    const defaultEmails: Record<string, string> = {
      Admin: 'admin@barriodigital.cl',
      Funcionario: 'funcionario@barriodigital.cl',
      Vecino: 'vecino@vecinos.cl',
      Auditor: 'auditor@barriodigital.cl'
    };

    const targetName = name || defaultNames[role] || `${role} Usuario`;
    const targetEmail = email || defaultEmails[role] || `${role.toLowerCase()}@barriodigital.cl`;

    try {
      // Solicitar token firmado criptográficamente al BFF
      const res: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/auth/demo-token`, {
          params: { role, name: targetName, email: targetEmail }
        })
      );

      const user: UserProfile = {
        username: targetEmail,
        name: targetName,
        email: targetEmail,
        role: res.role,
        token: res.accessToken,
        isMicrosoftAuth: false
      };

      this.setCurrentUser(user);
      return user;
    } catch (e) {
      console.warn('El BFF no respondió directamente al demo-token, generando sesión local de contingencia', e);
      // Contingencia local si el BFF no estuviese levantado aún
      const user: UserProfile = {
        username: targetEmail,
        name: targetName,
        email: targetEmail,
        role: role,
        token: 'demo-token-' + role.toLowerCase(),
        isMicrosoftAuth: false
      };
      this.setCurrentUser(user);
      return user;
    }
  }

  public setCurrentUser(user: UserProfile): void {
    localStorage.setItem('barriodigital_user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  public logout(): void {
    const current = this.currentUserSubject.value;
    localStorage.removeItem('barriodigital_user');
    this.currentUserSubject.next(null);

    if (current?.isMicrosoftAuth) {
      this.msalService.logoutPopup();
    }
    this.router.navigate(['/login']);
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  public getToken(): string | null {
    return this.currentUserSubject.value?.token || null;
  }

  public isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  public hasRole(role: string): boolean {
    const current = this.currentUserSubject.value;
    if (!current) return false;
    return current.role.toLowerCase() === role.toLowerCase();
  }

  public hasAnyRole(roles: string[]): boolean {
    const current = this.currentUserSubject.value;
    if (!current) return false;
    return roles.some(r => r.toLowerCase() === current.role.toLowerCase());
  }
}
