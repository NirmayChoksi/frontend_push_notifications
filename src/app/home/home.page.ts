import { Component } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
} from '@ionic/angular/standalone';
import { PushNotifications } from '@capacitor/push-notifications';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, catchError } from 'rxjs';

const url =
  'https://push-notifications-f7c23-default-rtdb.asia-southeast1.firebasedatabase.app/tokens.json';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
})
export class HomePage {
  constructor(private http: HttpClient) {}

  initializePushNotifications() {
    PushNotifications.requestPermissions().then((permission) => {
      if (permission.receive === 'granted') {
        PushNotifications.register();
      }
    });

    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token:', token.value);
      this.addTokenToArray(token.value).subscribe();
    });

    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification) => {
        console.log('Push received: ', notification);
      }
    );
  }

  addTokenToArray(token: string): Observable<any> {
    return this.http.get<string[]>(url).pipe(
      switchMap((tokens) => {
        const currentTokens = tokens || [];
        if (!currentTokens.includes(token)) {
          currentTokens.push(token);
        }
        return this.http.put(url, currentTokens);
      }),
      catchError((error) => {
        console.error('Error fetching tokens, initializing a new array', error);
        return this.http.put(url, [token]);
      })
    );
  }

  getTokens() {
    return this.http.get<string[]>(url);
  }

  sendNotification() {
    this.getTokens().subscribe({
      next: (res) => {
        console.log('res:', res);
        this.http
          .post('https://backend-ifjb.onrender.com/send', {
            guestTokens: res,
            title: 'test',
            body: 'this notification is being sent by nodejs',
          })
          .subscribe({
            next: (res) => {
              console.log(res);
            },
            error: (err) => {
              console.log(err);
            },
          });
      },
    });
  }
}
