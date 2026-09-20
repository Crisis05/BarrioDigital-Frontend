import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <!-- Card Principal -->
          <div class="card shadow border-0 rounded-4 overflow-hidden">
            <div class="card-header bg-dark text-white p-4 text-center" style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);">
              <div class="display-6 fw-bold mb-2">
                <i class="bi bi-buildings-fill text-warning me-2"></i>BarrioDigital
              </div>
              <p class="mb-0 text-light opacity-75">
                Plataforma de Trámites Comunales y Atención Vecinal &bull; Duoc UC
              </p>
            </div>

            <div class="card-body p-4 p-md-5">
              <!-- Mensajes informativos -->
              <div *ngIf="errorMessage" class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>{{ errorMessage }}
                <button type="button" class="btn-close" (click)="errorMessage = ''"></button>
              </div>

              <!-- Sección 1: Login Oficial Azure AD (IDaaS) -->
              <div class="text-center mb-4">
                <h5 class="fw-bold mb-3">Autenticación Corporativa (IDaaS)</h5>
                <p class="text-muted small">
                  Inicia sesión mediante Microsoft Entra ID (Azure AD). Se obtendrá un token Bearer JWT con tus roles comunales asignados.
                </p>
                <button
                  class="btn btn-outline-dark btn-lg px-4 py-2 d-inline-flex align-items-center gap-3 shadow-sm"
                  (click)="loginWithMicrosoft()"
                  [disabled]="loading"
                >
                  <i class="bi bi-microsoft text-primary fs-4"></i>
                  <span class="fw-semibold">Iniciar sesión con Microsoft</span>
                </button>
              </div>

              <div class="position-relative my-4">
                <hr class="text-muted" />
                <span class="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted small fw-semibold">
                  O SELECCIONA UN PERFIL PARA EVALUACIÓN RÁPIDA (MODO LAB)
                </span>
              </div>

              <!-- Sección 2: Perfiles para demostración y evaluación de roles -->
              <div class="mt-4">
                <div class="alert alert-info py-2 px-3 small d-flex align-items-center mb-3">
                  <i class="bi bi-info-circle-fill fs-5 me-2"></i>
                  <span>
                    Elige cualquiera de los 4 roles del caso. El BFF generará un token JWT RS256 firmado con los claims correspondientes para validar la autorización.
                  </span>
                </div>

                <div class="row g-3">
                  <!-- Rol Admin -->
                  <div class="col-md-6">
                    <div class="card h-100 border hover-shadow cursor-pointer p-3" (click)="loginAs('Admin')">
                      <div class="d-flex align-items-center justify-content-between mb-2">
                        <span class="badge bg-danger">Admin</span>
                        <i class="bi bi-shield-lock-fill text-danger fs-4"></i>
                      </div>
                      <h6 class="fw-bold mb-1">Administrador Municipal</h6>
                      <p class="text-muted small mb-2">
                        Define tipos de trámite, cupos diarios y analiza KPIs comunales.
                      </p>
                      <button class="btn btn-sm btn-outline-danger w-100 mt-auto" [disabled]="loading">
                        Entrar como Admin
                      </button>
                    </div>
                  </div>

                  <!-- Rol Funcionario -->
                  <div class="col-md-6">
                    <div class="card h-100 border hover-shadow cursor-pointer p-3" (click)="loginAs('Funcionario')">
                      <div class="d-flex align-items-center justify-content-between mb-2">
                        <span class="badge bg-info text-dark">Funcionario</span>
                        <i class="bi bi-person-workspace text-info fs-4"></i>
                      </div>
                      <h6 class="fw-bold mb-1">Funcionario / Operador</h6>
                      <p class="text-muted small mb-2">
                        Admite solicitudes, asigna cuadrillas a terreno y cierra trámites.
                      </p>
                      <button class="btn btn-sm btn-outline-primary w-100 mt-auto" [disabled]="loading">
                        Entrar como Funcionario
                      </button>
                    </div>
                  </div>

                  <!-- Rol Vecino -->
                  <div class="col-md-6">
                    <div class="card h-100 border hover-shadow cursor-pointer p-3" (click)="loginAs('Vecino')">
                      <div class="d-flex align-items-center justify-content-between mb-2">
                        <span class="badge bg-success">Vecino</span>
                        <i class="bi bi-house-door-fill text-success fs-4"></i>
                      </div>
                      <h6 class="fw-bold mb-1">Vecino / Cliente</h6>
                      <p class="text-muted small mb-2">
                        Ingresa trámites comunales por la web y sigue el estado con código único.
                      </p>
                      <button class="btn btn-sm btn-outline-success w-100 mt-auto" [disabled]="loading">
                        Entrar como Vecino
                      </button>
                    </div>
                  </div>

                  <!-- Rol Auditor -->
                  <div class="col-md-6">
                    <div class="card h-100 border hover-shadow cursor-pointer p-3" (click)="loginAs('Auditor')">
                      <div class="d-flex align-items-center justify-content-between mb-2">
                        <span class="badge bg-warning text-dark">Auditor</span>
                        <i class="bi bi-journal-text text-warning fs-4"></i>
                      </div>
                      <h6 class="fw-bold mb-1">Auditor Comunal</h6>
                      <p class="text-muted small mb-2">
                        Acceso de solo lectura a la línea de tiempo completa y trazabilidad de eventos.
                      </p>
                      <button class="btn btn-sm btn-outline-warning text-dark w-100 mt-auto" [disabled]="loading">
                        Entrar como Auditor
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div class="card-footer bg-light py-3 px-4 text-center text-muted small">
              <i class="bi bi-shield-check text-success me-1"></i>
              Flujo Seguro: MSAL (Angular) &rarr; AWS API Gateway &rarr; ms-barriodigital-bff (Spring Security) &rarr; Microservicios
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hover-shadow {
      transition: all 0.2s ease-in-out;
    }
    .hover-shadow:hover {
      transform: translateY(-3px);
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.12);
      border-color: #3b82f6 !important;
    }
    .cursor-pointer {
      cursor: pointer;
    }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);

  loading = false;
  errorMessage = '';

  async loginWithMicrosoft(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    try {
      await this.authService.loginWithMicrosoft();
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.errorMessage = 'No se pudo completar el inicio de sesión con Microsoft Azure AD. Para pruebas locales puedes usar los perfiles del modo demostración.';
    } finally {
      this.loading = false;
    }
  }

  async loginAs(role: string): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    try {
      await this.authService.loginWithDemoRole(role);
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.errorMessage = 'Error al generar sesión para el rol seleccionado.';
    } finally {
      this.loading = false;
    }
  }
}
