import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@app/core/services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-settings-page',
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.scss']
})
export class SettingsPageComponent implements OnInit {
  profileForm!: FormGroup;
  notificationForm!: FormGroup;
  themeForm!: FormGroup;
  securityForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadCurrentUserData();
    this.loadSavedSettings();
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.isLoading = true;
      const userData = this.profileForm.value;

      this.authService.updateUserProfile(userData)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe(
          () => {
            this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
          },
          (error: Error) => {
            this.snackBar.open('Error updating profile: ' + error.message, 'Close', { duration: 3000 });
          }
        );
    }
  }

  onNotificationSettingsChange(): void {
    const settings = this.notificationForm.value;
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    this.snackBar.open('Notification settings saved', 'Close', { duration: 3000 });
  }

  onThemeChange(): void {
    const theme = this.themeForm.value;
    localStorage.setItem('themeSettings', JSON.stringify(theme));
    this.snackBar.open('Theme settings saved', 'Close', { duration: 3000 });
  }

  onSecuritySettingsChange(): void {
    const settings = this.securityForm.value;
    localStorage.setItem('securitySettings', JSON.stringify(settings));
    this.snackBar.open('Security settings saved', 'Close', { duration: 3000 });
  }

  private initializeForms(): void {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.pattern(/^\+?[\d\s-]+$/)]
    });

    this.notificationForm = this.fb.group({
      emailNotifications: [true],
      pushNotifications: [false],
      notificationFrequency: ['daily']
    });

    this.themeForm = this.fb.group({
      darkMode: [false],
      fontSize: ['medium'],
      colorScheme: ['default']
    });

    this.securityForm = this.fb.group({
      twoFactorAuth: [false],
      sessionTimeout: ['30'],
      rememberMe: [true]
    });
  }

  private loadCurrentUserData(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.profileForm.patchValue({
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone || ''
      });
    }
  }

  private loadSavedSettings(): void {
    try {
      const notificationSettings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
      const themeSettings = JSON.parse(localStorage.getItem('themeSettings') || '{}');
      const securitySettings = JSON.parse(localStorage.getItem('securitySettings') || '{}');

      this.notificationForm.patchValue(notificationSettings);
      this.themeForm.patchValue(themeSettings);
      this.securityForm.patchValue(securitySettings);
    } catch (error) {
      console.error('Error loading saved settings:', error);
    }
  }
}
