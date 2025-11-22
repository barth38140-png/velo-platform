import React from 'react';
import '../styles/NotificationCenter.css';

export default function NotificationCenter({ notifications = [], onDismiss }) {
  return (
    <div className="notification-center">
      {notifications.length === 0 ? null : (
        <div className="notification-list">
          {notifications.map(n => (
            <div className="notification-item" key={n.id}>
              <div className="notification-text">{n.text}</div>
              <button className="notification-dismiss" onClick={() => onDismiss && onDismiss(n.id)}>Dismiss</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
