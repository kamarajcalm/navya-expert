
import { Animation } from '@ionic/core';

export default function slideOutHorizontalLeft(Animation, baseEl) {

    const baseAnimation = new Animation();

    const backdropAnimation = new Animation();
    backdropAnimation.addElement(baseEl.querySelector('ion-backdrop'));

    const wrapperAnimation = new Animation();
    const wrapperEl = baseEl.querySelector('.modal-wrapper');
    wrapperAnimation.addElement(wrapperEl);
    const wrapperElRect = wrapperEl.getBoundingClientRect();

    wrapperAnimation.beforeStyles({ 'opacity': 1 })
                    .fromTo('translateX', '0%', '-100%');

    backdropAnimation.fromTo('opacity', 0.4, 0.0);

    return Promise.resolve(baseAnimation
      .addElement(baseEl)
      .easing('ease-out')
      .duration(250)
      .add(backdropAnimation)
      .add(wrapperAnimation));

}
