import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, UserProfile } from '../../auth/auth.service';
import { ApiService } from '../../core/services/api.service';
import { RequestItem, KpisResponse } from '../../core/models/request.model';
import { ProcedureType } from '../../core/models/procedure.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container py-4" *ngIf="currentUser">
      <!-- Encabezado de bienvenida -->
      <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom">
        <div>
          <h2 class="fw-bold text-dark mb-1">
            Panel de Operaciones &bull; {{ currentUser.role }}
          </h2>
          <p class="text-muted mb-0">
            Bienvenido, <span class="fw-semibold text-primary">{{ currentUser.name }}</span> ({{ currentUser.email }})
          </p>
        </div>
        <div class="mt-2 mt-md-0 d-flex gap-2">
          <a routerLink="/requests" class="btn btn-primary">
            <i class="bi bi-card-checklist me-1"></i> Ver Trámites
          </a>
          <a *ngIf="currentUser.role === 'Admin'" routerLink="/reports" class="btn btn-outline-secondary">
            <i class="bi bi-bar-chart me-1"></i> Ver Métricas
          </a>
        </div>
      </div>

      <!-- Tarjetas de Resumen Rápido -->
      <div class="row g-3 mb-4">
        <div class="col-sm-6 col-lg-3">
          <div class="card shadow-sm border-0 border-start border-primary border-4 p-3 bg-white">
            <div class="text-muted small fw-semibold">TRÁMITES TOTALES</div>
            <div class="fs-3 fw-bold text-dark">{{ kpis?.totalRequests || requests.length }}</div>
            <div class="text-success small"><i class="bi bi-arrow-up-right me-1"></i>En red comunal</div>
          </div>
        </div>

        <div class="col-sm-6 col-lg-3">
          <div class="card shadow-sm border-0 border-start border-warning border-4 p-3 bg-white">
            <div class="text-muted small fw-semibold">EN GESTIÓN / TERRENO</div>
            <div class="fs-3 fw-bold text-warning">{{ kpis?.activeRequests || countActive() }}</div>
            <div class="text-muted small">Atención en curso</div>
          </div>
        </div>

        <div class="col-sm-6 col-lg-3">
          <div class="card shadow-sm border-0 border-start border-success border-4 p-3 bg-white">
            <div class="text-muted small fw-semibold">RESUELTOS</div>
            <div class="fs-3 fw-bold text-success">{{ kpis?.resolvedRequests || countResolved() }}</div>
            <div class="text-success small"><i class="bi bi-check-circle me-1"></i>Completados</div>
          </div>
        </div>

        <div class="col-sm-6 col-lg-3">
          <div class="card shadow-sm border-0 border-start border-info border-4 p-3 bg-white">
            <div class="text-muted small fw-semibold">TIEMPO PROMEDIO</div>
            <div class="fs-3 fw-bold text-info">{{ kpis?.avgResolutionHours || 18.5 }}h</div>
            <div class="text-muted small">Resolución vecinal</div>
          </div>
        </div>
      </div>

      <!-- VISTA CONTEXTUAL SEGÚN EL ROL -->

      <!-- 1. VISTA FUNCIONARIO: Cola de Admisión y En Terreno -->
      <div *ngIf="currentUser.role === 'Funcionario'" class="row g-4 mb-4">
        <div class="col-lg-6">
          <div class="card shadow-sm border-0 h-100">
            <div class="card-header bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
              <span><i class="bi bi-hourglass-split text-warning me-2"></i>Cola de Admisión (Nuevas Solicitudes)</span>
              <span class="badge bg-warning text-dark">{{ admissionQueue.length }} pendientes</span>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="table-light small">
                    <tr>
                      <th>Código</th>
                      <th>Trámite</th>
                      <th>Vecino</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let req of admissionQueue">
                      <td class="fw-bold text-primary">{{ req.trackingNumber }}</td>
                      <td>{{ req.procedureName }}</td>
                      <td>{{ req.citizenName }}</td>
                      <td>
                        <a [routerLink]="['/requests']" class="btn btn-sm btn-outline-primary">
                          Revisar
                        </a>
                      </td>
                    </tr>
                    <tr *ngIf="admissionQueue.length === 0">
                      <td colspan="4" class="text-center text-muted py-3">
                        No hay solicitudes pendientes de admisión en este momento.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="card shadow-sm border-0 h-100">
            <div class="card-header bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
              <span><i class="bi bi-truck text-primary me-2"></i>Cuadrillas en Terreno Activas</span>
              <span class="badge bg-primary">{{ terrainQueue.length }} en ruta</span>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="table-light small">
                    <tr>
                      <th>Código</th>
                      <th>Cuadrilla</th>
                      <th>Dirección</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let req of terrainQueue">
                      <td class="fw-bold">{{ req.trackingNumber }}</td>
                      <td>{{ req.assignedCrew || 'Sin asignar' }}</td>
                      <td class="small">{{ req.address }}</td>
                      <td><span class="badge bg-info text-dark">EN_TERRENO</span></td>
                    </tr>
                    <tr *ngIf="terrainQueue.length === 0">
                      <td colspan="4" class="text-center text-muted py-3">
                        No hay cuadrillas asignadas en terreno actualmente.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. VISTA VECINO: Mis Solicitudes y Seguimiento -->
      <div *ngIf="currentUser.role === 'Vecino'" class="row g-4 mb-4">
        <div class="col-lg-8">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
              <span><i class="bi bi-folder2-open text-primary me-2"></i>Mis Solicitudes Comunales</span>
              <a routerLink="/requests" class="btn btn-sm btn-primary">
                <i class="bi bi-plus-lg me-1"></i> Ingresar Trámite
              </a>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="table-light small">
                    <tr>
                      <th>N° Seguimiento</th>
                      <th>Trámite</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let req of requests">
                      <td class="fw-bold text-primary">{{ req.trackingNumber }}</td>
                      <td>{{ req.procedureName }}</td>
                      <td class="small text-muted">{{ req.createdAt | date:'short' }}</td>
                      <td>
                        <span class="badge" [ngClass]="getStatusBadge(req.status)">
                          {{ req.status }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="card shadow-sm border-0 p-3 bg-light">
            <h6 class="fw-bold mb-3"><i class="bi bi-info-circle text-primary me-2"></i>¿Cómo funciona tu trámite?</h6>
            <ol class="small text-muted ps-3 mb-3">
              <li class="mb-2"><strong>Ingresado:</strong> Recibes tu número único de seguimiento.</li>
              <li class="mb-2"><strong>Admitido:</strong> Un funcionario valida los antecedentes y descuenta el cupo comunal.</li>
              <li class="mb-2"><strong>En Terreno:</strong> La cuadrilla de operaciones visita el lugar.</li>
              <li><strong>Resuelto:</strong> Se concluye la labor y se emite constancia.</li>
            </ol>
            <div class="alert alert-warning small mb-0">
              <i class="bi bi-shield-lock me-1"></i> Recuerda guardar tu código de seguimiento para consultas.
            </div>
          </div>
        </div>
      </div>

      <!-- 3. VISTA ADMIN / AUDITOR: Resumen de Catálogo y Auditoría -->
      <div *ngIf="currentUser.role === 'Admin' || currentUser.role === 'Auditor'" class="row g-4 mb-4">
        <div class="col-lg-7">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
              <span><i class="bi bi-list-check text-primary me-2"></i>Últimos Trámites en el Sistema</span>
              <a routerLink="/requests" class="btn btn-sm btn-outline-primary">Ver Todos</a>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="table-light small">
                    <tr>
                      <th>Código</th>
                      <th>Trámite</th>
                      <th>Vecino</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let req of requests.slice(0, 5)">
                      <td class="fw-bold text-primary">{{ req.trackingNumber }}</td>
                      <td>{{ req.procedureName }}</td>
                      <td>{{ req.citizenName }}</td>
                      <td>
                        <span class="badge" [ngClass]="getStatusBadge(req.status)">
                          {{ req.status }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-5">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-white fw-bold py-3">
              <i class="bi bi-pie-chart text-info me-2"></i>Distribución de Estados
            </div>
            <div class="card-body">
              <div *ngFor="let statusKey of statusKeys" class="mb-2">
                <div class="d-flex justify-content-between small mb-1">
                  <span>{{ statusKey }}</span>
                  <span class="fw-bold">{{ countByStatus(statusKey) }}</span>
                </div>
                <div class="progress" style="height: 6px;">
                  <div
                    class="progress-bar"
                    [ngClass]="getProgressBarClass(statusKey)"
                    [style.width.%]="getProgressPercent(statusKey)"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);

  currentUser: UserProfile | null = null;
  requests: RequestItem[] = [];
  kpis: KpisResponse | null = null;

  statusKeys = ['INGRESADO', 'ADMITIDO', 'EN_GESTION', 'EN_TERRENO', 'RESUELTO', 'RECHAZADO'];

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadData();
  }

  loadData(): void {
    this.apiService.getRequests().subscribe({
      next: (data) => (this.requests = data),
      error: (err) => console.error('Error cargando trámites:', err)
    });

    this.apiService.getKpis().subscribe({
      next: (data) => (this.kpis = data),
      error: (err) => console.error('Error cargando KPIs:', err)
    });
  }

  get admissionQueue(): RequestItem[] {
    return this.requests.filter((r) => r.status === 'INGRESADO');
  }

  get terrainQueue(): RequestItem[] {
    return this.requests.filter((r) => r.status === 'EN_TERRENO' || r.status === 'EN_GESTION');
  }

  countActive(): number {
    return this.requests.filter((r) => r.status !== 'RESUELTO' && r.status !== 'RECHAZADO').length;
  }

  countResolved(): number {
    return this.requests.filter((r) => r.status === 'RESUELTO').length;
  }

  countByStatus(status: string): number {
    return this.requests.filter((r) => r.status === status).length;
  }

  getProgressPercent(status: string): number {
    if (!this.requests.length) return 0;
    return (this.countByStatus(status) / this.requests.length) * 100;
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'INGRESADO':
        return 'bg-secondary text-white';
      case 'ADMITIDO':
        return 'bg-primary text-white';
      case 'EN_GESTION':
        return 'bg-warning text-dark';
      case 'EN_TERRENO':
        return 'bg-info text-dark';
      case 'RESUELTO':
        return 'bg-success text-white';
      case 'RECHAZADO':
        return 'bg-danger text-white';
      default:
        return 'bg-light text-dark';
    }
  }

  getProgressBarClass(status: string): string {
    switch (status) {
      case 'INGRESADO':
        return 'bg-secondary';
      case 'ADMITIDO':
        return 'bg-primary';
      case 'EN_GESTION':
        return 'bg-warning';
      case 'EN_TERRENO':
        return 'bg-info';
      case 'RESUELTO':
        return 'bg-success';
      case 'RECHAZADO':
        return 'bg-danger';
      default:
        return 'bg-dark';
    }
  }
}
