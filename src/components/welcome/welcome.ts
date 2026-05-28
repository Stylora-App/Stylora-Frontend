import {
  Component, signal, inject, computed,
  OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, HostListener,
  Output, EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { WardrobeService } from '../../services/wardrobe.service';
import { ILoginRequest, IRegisterRequest } from '../../models';
import {
  PASSWORD_POLICY_MESSAGE,
  hasMinPasswordLength,
  hasSpecialCharacter,
  hasUppercaseLetter,
  isPasswordPolicyValid
} from '../../utils/password-policy';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './welcome.html',
  styleUrl: './welcome.css'
})
export class WelcomeComponent implements OnInit, OnDestroy, AfterViewInit {
  private authService = inject(AuthService);
  private wardrobeService = inject(WardrobeService);
  private router = inject(Router);

  @Output() authenticated = new EventEmitter<void>();

  @ViewChild('flowSection')     flowSectionRef!:     ElementRef<HTMLElement>;
  @ViewChild('analysisSection') analysisSectionRef!: ElementRef<HTMLElement>;
  @ViewChild('stylistSection')  stylistSectionRef!:  ElementRef<HTMLElement>;
  @ViewChild('wardrobeSection') wardrobeSectionRef!: ElementRef<HTMLElement>;
  @ViewChild('exploreSection')  exploreSectionRef!:  ElementRef<HTMLElement>;
  @ViewChild('finalCtaSection') finalCtaSectionRef!: ElementRef<HTMLElement>;

  // ── Entry animation ──────────────────────────────────────────────────────
  entered   = signal(false);
  navScrolled = signal(false);

  // ── Hero mouse-tracking glow ─────────────────────────────────────────────
  heroMouseX = signal(60);
  heroMouseY = signal(30);

  heroGlowBg = computed(() =>
    `radial-gradient(50% 50% at ${this.heroMouseX()}% ${this.heroMouseY()}%, rgba(230,199,154,.22), transparent 70%)`
  );

  // ── Section reveal states ─────────────────────────────────────────────────
  flowShown     = signal(false);
  analysisShown = signal(false);
  stylistShown  = signal(false);
  wardrobeShown = signal(false);
  exploreShown  = signal(false);
  finalCtaShown = signal(false);

  // ── Explore gender toggle ─────────────────────────────────────────────────
  exploreGender = signal<'women' | 'men'>('women');

  // ── Wardrobe fan ─────────────────────────────────────────────────────────
  wardrobeActive = signal(2);
  readonly wardrobeItems = [
    { label: 'Denim layer',    cat: 'outer',     color: '#4a6178' },
    { label: 'Rust knit',      cat: 'top',       color: '#a96a3c' },
    { label: 'Ecru trousers',  cat: 'bottom',    color: '#d9c8a8' },
    { label: 'Tan mules',      cat: 'shoe',      color: '#8a6440' },
    { label: 'Gold hoop',      cat: 'accessory', color: '#caa253' },
  ];

  getFanStyle(i: number): Record<string, string | number> {
    const offset = i - this.wardrobeActive();
    const abs    = Math.abs(offset);
    const shown  = this.wardrobeShown();
    const tx     = offset * 130;
    const ty     = abs * abs * 16;
    const rot    = offset * 9;
    const scale  = Math.max(0.78, 1.1 - abs * 0.13);
    const opacity = Math.max(0.45, 1 - abs * 0.22);
    const zIndex  = 10 - abs;
    const transform = shown
      ? `translate(-50%,-50%) translate3d(${tx}px,${ty}px,0) rotate(${rot}deg) scale(${scale})`
      : `translate(-50%,-50%) translate3d(0px,60px,0) scale(.5)`;
    return {
      transform,
      opacity: shown ? opacity : 0,
      zIndex,
      transition: 'transform 600ms cubic-bezier(.22,1,.36,1), box-shadow 320ms ease, border-color 220ms ease, opacity 320ms ease'
    };
  }

  // ── Drawer ────────────────────────────────────────────────────────────────
  drawerOpen = signal(false);

  // ── Auth forms ────────────────────────────────────────────────────────────
  isLoginMode          = signal(true);
  isLoading            = signal(false);
  errorMessage         = signal('');
  successMessage       = signal('');
  showLoginPassword    = signal(false);
  showRegisterPassword = signal(false);
  showConfirmPassword  = signal(false);

  readonly passwordPolicyMessage = PASSWORD_POLICY_MESSAGE;

  loginEmail    = '';
  loginPassword = '';
  rememberMe    = false;

  firstName       = '';
  lastName        = '';
  registerEmail   = '';
  registerPassword = '';
  confirmPassword = '';

  // ── Data ──────────────────────────────────────────────────────────────────
  readonly heroPaletteColors = ['#7a3a2f', '#a86438', '#cf9b5e', '#d9b483', '#6b7d7a', '#3e4a4a'];
  readonly titleWords        = ['Style', 'begins'];

  readonly flowSteps = [
    { n: '01', title: 'Read your undertone',  body: 'Upload a selfie. We read hair, eyes and skin to place you in your seasonal palette.',                                                     color: '#a96a3c' },
    { n: '02', title: 'Build your wardrobe',   body: 'Scan clothes you own. Stylora tags fit, colour and category — your closet, but searchable.',                                             color: '#cf9b5e' },
    { n: '03', title: 'Ask your stylist',       body: 'Tell us about your day. Stylora pulls a head-to-toe look from pieces you already own.',                                                  color: '#6b7d7a' },
    { n: '04', title: 'Discover & try on',     body: 'Browse real pieces from your favourite brands, filtered by your palette — then see them on you before you commit.',                     color: '#7a3a2f' },
  ];

  readonly analysisPaletteColors = ['#7a3a2f', '#a96a3c', '#cf9b5e', '#d9b483', '#6b7d7a', '#3e4a4a'];

  readonly stylistMessages = [
    { role: 'assistant', text: 'Where are you headed today? Share the vibe and I\'ll pull a look from your wardrobe.' },
    { role: 'user',      text: 'Casual brunch with friends, sunny, 22°C in Milan.' },
    { role: 'assistant', text: 'Going relaxed-warm: rust knit, ecru trousers, leather mules. Denim layer in case the breeze picks up.' },
  ];

  readonly stylistBullets = [
    'Pulls only from pieces you already own',
    'Adjusts for weather, occasion and dress code',
    'Explains why each piece works for your palette',
  ];

  readonly exploreBullets = [
    'Hand-picked from real e-commerce catalogues',
    'Filtered by your seasonal palette and sub-season',
    'Virtual try-on before you visit the brand site',
  ];

  readonly explorePaletteColors = ['#7a3a2f', '#a96a3c', '#cf9b5e', '#d9b483', '#6b7d7a'];

  private readonly exploreProducts = {
    women: [
      { brand: 'Aurea', name: 'Rust merino knit',       tone: '#a96a3c', swatch: '#a96a3c', cat: 'Top'    },
      { brand: 'Linea', name: 'Ecru wide trouser',       tone: '#dcc7a0', swatch: '#dcc7a0', cat: 'Bottom' },
      { brand: 'Maré',  name: 'Caramel leather mule',   tone: '#8a6440', swatch: '#8a6440', cat: 'Shoe'   },
      { brand: 'Nord',  name: 'Olive trench coat',       tone: '#6b6f44', swatch: '#6b6f44', cat: 'Outer'  },
      { brand: 'Soto',  name: 'Terracotta silk top',     tone: '#c97a4f', swatch: '#c97a4f', cat: 'Top'    },
      { brand: 'Verde', name: 'Sage suede bag',          tone: '#7b8a72', swatch: '#7b8a72', cat: 'Bag'    },
    ],
    men: [
      { brand: 'Aurea', name: 'Cognac suede jacket',    tone: '#8a5530', swatch: '#8a5530', cat: 'Outer'  },
      { brand: 'Linea', name: 'Olive linen shirt',      tone: '#7d8455', swatch: '#7d8455', cat: 'Top'    },
      { brand: 'Maré',  name: 'Sand chino trouser',     tone: '#c4a779', swatch: '#c4a779', cat: 'Bottom' },
      { brand: 'Nord',  name: 'Brick wool overshirt',   tone: '#9a4d3a', swatch: '#9a4d3a', cat: 'Outer'  },
      { brand: 'Soto',  name: 'Cream cotton knit',      tone: '#e5d6b8', swatch: '#e5d6b8', cat: 'Top'    },
      { brand: 'Verde', name: 'Tan leather derby',      tone: '#a07549', swatch: '#a07549', cat: 'Shoe'   },
    ],
  };

  currentExploreProducts = computed(() => this.exploreProducts[this.exploreGender()]);

  private observers:    IntersectionObserver[] = [];
  private enterTimer?:  ReturnType<typeof setTimeout>;
  private wardrobeTimer?: ReturnType<typeof setInterval>;

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit() {
    this.enterTimer = setTimeout(() => this.entered.set(true), 120);
  }

  ngAfterViewInit() {
    this.observe(
      this.flowSectionRef, 0.15,
      () => this.flowShown.set(true),
      () => this.flowShown.set(false)
    );
    this.observe(
      this.analysisSectionRef, 0.18,
      () => this.analysisShown.set(true),
      () => this.analysisShown.set(false)
    );
    this.observe(
      this.stylistSectionRef, 0.18,
      () => this.stylistShown.set(true),
      () => this.stylistShown.set(false)
    );
    this.observe(
      this.wardrobeSectionRef, 0.18,
      () => {
        this.wardrobeShown.set(true);
        if (!this.wardrobeTimer) {
          this.wardrobeTimer = setInterval(
            () => this.wardrobeActive.update(a => (a + 1) % this.wardrobeItems.length),
            2800
          );
        }
      },
      () => {
        this.wardrobeShown.set(false);
        clearInterval(this.wardrobeTimer);
        this.wardrobeTimer = undefined;
      }
    );
    this.observe(
      this.exploreSectionRef, 0.18,
      () => this.exploreShown.set(true),
      () => this.exploreShown.set(false)
    );
    this.observe(
      this.finalCtaSectionRef, 0.22,
      () => this.finalCtaShown.set(true),
      () => this.finalCtaShown.set(false)
    );
  }

  ngOnDestroy() {
    clearTimeout(this.enterTimer);
    clearInterval(this.wardrobeTimer);
    this.observers.forEach(o => o.disconnect());
    document.body.style.overflow = '';
  }

  /**
   * Bidirectional IntersectionObserver.
   * onEnter fires when ≥ threshold% is visible.
   * onLeave fires when the element has fully left the viewport.
   * Both use a fixed bottom margin so animations trigger just
   * before the element reaches the viewport center.
   */
  private observe(
    ref: ElementRef<HTMLElement>,
    threshold: number,
    onEnter: () => void,
    onLeave?: () => void
  ) {
    if (!ref?.nativeElement) return;
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting && e.intersectionRatio >= threshold * 0.9) {
            onEnter();
          } else if (!e.isIntersecting && onLeave) {
            onLeave();
          }
        });
      },
      {
        threshold: onLeave ? [0, threshold] : threshold,
        rootMargin: '0px 0px -6% 0px'
      }
    );
    obs.observe(ref.nativeElement);
    this.observers.push(obs);
  }

  // ── Host listeners ────────────────────────────────────────────────────────
  @HostListener('window:scroll')
  onWindowScroll() {
    this.navScrolled.set(window.scrollY > 40);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && this.drawerOpen()) this.closeDrawer();
  }

  onHeroMouseMove(e: MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    this.heroMouseX.set(((e.clientX - rect.left) / rect.width) * 100);
    this.heroMouseY.set(((e.clientY - rect.top) / rect.height) * 100);
  }

  // ── Drawer ────────────────────────────────────────────────────────────────
  openDrawer(mode: 'login' | 'register' = 'register') {
    this.isLoginMode.set(mode === 'login');
    this.errorMessage.set('');
    this.successMessage.set('');
    this.drawerOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeDrawer() {
    this.drawerOpen.set(false);
    document.body.style.overflow = '';
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  setAuthMode(isLogin: boolean) {
    this.isLoginMode.set(isLogin);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.showLoginPassword.set(false);
    this.showRegisterPassword.set(false);
    this.showConfirmPassword.set(false);
  }

  hasRegisterPasswordMinLength()     { return hasMinPasswordLength(this.registerPassword); }
  hasRegisterPasswordUppercase()     { return hasUppercaseLetter(this.registerPassword); }
  hasRegisterPasswordSpecialChar()   { return hasSpecialCharacter(this.registerPassword); }
  isRegisterPasswordValid()          { return isPasswordPolicyValid(this.registerPassword); }
  hasStartedRegisterPassword()       { return this.registerPassword.length > 0; }
  hasStartedConfirmPassword()        { return this.confirmPassword.length > 0; }
  doPasswordsMatch()                 { return this.registerPassword === this.confirmPassword; }

  isFieldInvalid(f: NgModel | null | undefined): boolean {
    return Boolean(f && f.touched && f.invalid);
  }

  isRegisterPasswordFieldInvalid(f: NgModel | null | undefined): boolean {
    return Boolean(f && f.touched && (!f.value || !this.isRegisterPasswordValid()));
  }

  isConfirmPasswordInvalid(f: NgModel | null | undefined): boolean {
    return Boolean(f && f.touched && (!f.value || !this.doPasswordsMatch()));
  }

  getRegisterEmailError(f: NgModel | null | undefined): string {
    if (!f?.touched) return '';
    if (f.errors?.['required']) return 'Email is required.';
    if (f.errors?.['email'])    return 'Enter a valid email address.';
    return '';
  }

  getConfirmPasswordError(f: NgModel | null | undefined): string {
    if (!f?.touched) return '';
    if (!f.value)               return 'Please confirm your password.';
    if (!this.doPasswordsMatch()) return 'Passwords do not match.';
    return '';
  }

  async onLogin(form?: NgForm) {
    this.errorMessage.set('');
    this.successMessage.set('');
    if (!this.loginEmail || !this.loginPassword) {
      form?.control.markAllAsTouched();
      this.errorMessage.set('Please enter your email and password.');
      return;
    }
    this.isLoading.set(true);
    const request: ILoginRequest = {
      email: this.loginEmail,
      password: this.loginPassword,
      rememberMe: this.rememberMe
    };
    const response = await this.authService.login(request);
    this.isLoading.set(false);
    if (response.success) {
      this.closeDrawer();
      this.wardrobeService.initializeData();
      if (this.authenticated.observed) {
        this.authenticated.emit();
      } else {
        this.router.navigate(['/dashboard']);
      }
    } else {
      this.errorMessage.set(response.message || 'Login failed. Please try again.');
    }
  }

  async onRegister(form?: NgForm) {
    this.errorMessage.set('');
    this.successMessage.set('');
    if (!this.firstName.trim() || !this.lastName.trim() || !this.registerEmail || !this.registerPassword) {
      form?.control.markAllAsTouched();
      this.errorMessage.set('Please complete all required fields.');
      return;
    }
    if (!this.isRegisterPasswordValid()) {
      form?.control.markAllAsTouched();
      this.errorMessage.set(this.passwordPolicyMessage);
      return;
    }
    if (this.registerPassword !== this.confirmPassword) {
      form?.control.markAllAsTouched();
      this.errorMessage.set('Passwords do not match.');
      return;
    }
    this.isLoading.set(true);
    const request: IRegisterRequest = {
      email: this.registerEmail,
      password: this.registerPassword,
      firstName: this.firstName.trim() || undefined,
      lastName: this.lastName.trim() || undefined
    };
    const response = await this.authService.register(request);
    this.isLoading.set(false);
    if (response.success) {
      this.closeDrawer();
      this.wardrobeService.initializeData();
      if (this.authenticated.observed) {
        this.authenticated.emit();
      } else {
        this.router.navigate(['/dashboard']);
      }
    } else {
      this.errorMessage.set(response.message || 'Registration failed. Please try again.');
    }
  }
}
