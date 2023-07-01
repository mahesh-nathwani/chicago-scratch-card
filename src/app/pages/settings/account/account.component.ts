import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

enum SCRATCH_TYPE {
    BRUSH,
    SPRAY, 
    CIRCLE
  }
const WEIGHTS = {2: 0.15, 3: 0.15, 4: 0.2, 5: 0.2, 6: 0.1, 7: 0.1, 8: 0.1};
const MIN_VALUE = 5;
const MAX_VALUE = 70;
  // const WEIGHTS = {0:0.001, 1: 0.05, 2: 0.05, 3: 0.05, 4: 0.05, 5: 0.1, 6: 0.1, 7: 0.1, 8: 0.1, 9: 0.1, 10: 0.1, 11: 0.01, 12: 0.01, 13: 0.01, 14: 0.01, 15: 0.01, 16: 0.01, 17: 0.01, 18: 0.01, 19: 0.01, 20: 0.01, 21: 0.01, 22: 0.01, 23: 0.01, 24: 0.01, 25: 0.01, 26: 0.01, 27: 0.01, 28: 0.01, 29: 0.01, 50: 0.001, 45: 0.002, 40: 0.002, 35: 0.002, 30: 0.002};
  interface SC_CONFIG {
    scratchType: SCRATCH_TYPE;
    containerWidth: number;
    containerHeight: number;
    imageForwardSrc: string;
    imageBackgroundSrc: string;
    htmlBackground: string; 
    clearZoneRadius: number; 
    nPoints: number;
    pointSize: number;
    percentToFinish: number;
    callback ?: () => void;
    brushSrc: string;
    cursor: { 
      cur: string,
      png: string, 
      poosition: number[] 
    };
    enabledPercentUpdate: boolean;
  }
@Component({
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './account.component.html',
    styleUrls: ['./account.component.css'],
})
export class AccountComponent {
    name = 'Angular';
    @ViewChild('canvas', {static : true}) canvas: ElementRef;
    canvasElement: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    brushImage: HTMLImageElement;
    showButton = false;
    private callbackDone: Boolean;
    private readyToClear: Boolean;
    amount = 100;
  
    public zone: {top: number, left: number};
    private position: number[];
    percent: number;
    mouseX: number;
    mouseY: number;
    private config: SC_CONFIG;
    private scratchType: SCRATCH_TYPE;
  
    private readonly _router = inject(Router);
    private readonly _route = inject(ActivatedRoute);
  
    constructor() {
    }
  
    ngOnInit() {
        this._route.queryParams.subscribe(p => {
            this.amount = Number(p['amount']) || 100;
            this.resetCard();
        });
    }

    weightedRandom() {
        let i, sum=0, r=Math.random();
        for (i in WEIGHTS) {
          sum += WEIGHTS[i];
          if (r <= sum) return i;
        }
      }  
  
    canvasInit() {
      this.canvasElement = document.createElement('canvas');
      this.ctx = this.canvasElement.getContext('2d') as CanvasRenderingContext2D;
      this.canvasElement.classList.add('sc-canvas');
      this.canvasElement.classList.add('mx-auto');
      this.canvasElement.width = 300;
      this.canvasElement.height = 300;
      this.canvas.nativeElement.appendChild(this.canvasElement);
      this.ctx.globalCompositeOperation='destination-over'; 
      
  
      /* Attaching Events */
      this.canvasElement.addEventListener('mousedown', (event) => {
        event.preventDefault();
        this._setScratchPosition();
        this.canvasElement.addEventListener('mousemove', this.scratching);
        this.removeMouseListner();
      });
  
      /* Mobile events */
      this.canvasElement.addEventListener('touchstart', (event) => {
        console.log('called touch event', 1);
        event.preventDefault();
        this._setScratchPosition();
        this.canvasElement.addEventListener('touchmove', this.scratching);
        this.removeTouchEventListner();
      });
  
      this.canvasImageLoad();
    }
  
    canvasImageLoad (): Promise<any> {
      const randomNumber = '?'+Math.random();
      const img = 'assets/logo12-ai.png';
      return new Promise((resolve: any, reject: any) => {
        this.loadImage(img).then((img: unknown) => {
          this.ctx.drawImage(img as CanvasImageSource, 0, 0, 300, 300);
          resolve();
        }, (event: Event): Error => {
          // Reject init
          reject(event);
          return new TypeError(`${img} is not loaded.`);
        });
      });
    }
  
    /**
   * Make a promise to load image
   * @param src {String}
   */
    loadImage(src: string) {
      return new Promise((resolve, reject) => { 
        let image = new Image();
        image.crossOrigin = "Anonymous"; // Work only if the server response headers contains [Access-Control-Allow-Origin: *]
        // image.setAttribute('crossOrigin', '');
        this.prizeCanvasInit();
        image.onload = () => {
          resolve(image);  
        };
        image.src = src;
        image.onerror = (event: Event) => { 
          const error = new Error(`Image ${src} is not loaded.`);
          reject(error);
        }
      });
    }
  
    prizeCanvasInit() {
      const prizeCanvasElement = (<HTMLCanvasElement>document.getElementById('myCanvas'));
      const canvasaa = prizeCanvasElement.getContext('2d');
      canvasaa.font = '20px Arial';
      if (this.percent > 60) {
        canvasaa.clearRect(0, 0, prizeCanvasElement.width, prizeCanvasElement.height);
        canvasaa.fillStyle = '#000'; // or whatever color the background is.
        canvasaa.fillText(this.config.htmlBackground , 10, 50);
        this.showButton = true;
      } else {
        canvasaa.fillText('' , 10, 50);
      }
    } 
  
    _setScratchPosition () {
      this.zone = this.getOffset(this.canvasElement);
      console.log(this.zone ,' Zone');
    }
  
    scratching = this.throttle((event: Event) => {
      console.log('throttle called');
      event.preventDefault();
      this.dispatchEvent('scratch', 'move');
      this.position = this.mousePosition(event);
      this.updateMousePosition(this.position[0], this.position[1]);
      this.scratch();
  
      // calculate the percent of area scratched.
      if (this.config.enabledPercentUpdate) {
        this.prizeCanvasInit();
        this.percent = this.updatePercent();
      }
    }, 16);
  
    throttle (callback: Function, delay: number) {
      let last: number;
      let timer;
      return function () {
          let context = this;
          let now: number = +new Date();
          let args = arguments;
          if (last && now < last + delay) {
              // le délai n'est pas écoulé on reset le timer
              clearTimeout(timer);
              timer = setTimeout(function () {
                  last = now;
                  callback.apply(context, args);
              }, delay);
          } else {
              last = now;
              callback.apply(context, args);
          }
      };
    }
    /**
     * Distpach event
     * @param {string} phase
     * @param {string} type
   */
    dispatchEvent (phase: string, type: string) {
      this.dispatchCustomEvent(this.canvasElement, `${phase}.${type}`, {});
    }
  
    dispatchCustomEvent (target: HTMLCanvasElement, type: string, detail: any) {
      let customEvent = new CustomEvent(type, {
        bubbles: true,
        cancelable: true,
        detail: detail
      });
      target.dispatchEvent(customEvent);
    }
  
    mousePosition (event: any): number[] {
      let posX: number;
      let posY: number;
  
      switch (event.type) {
        case 'touchmove':
          posX = event.touches[0].clientX - this.config.clearZoneRadius - this.zone.left;
          posY = event.touches[0].clientY - this.config.clearZoneRadius - this.zone.top;
          break;
        case 'mousemove':
          posX = event.clientX - this.config.clearZoneRadius - this.zone.left;
          posY = event.clientY - this.config.clearZoneRadius - this.zone.top;
          break;
      }
  
      return [posX, posY];
    }
  
    removeMouseListner() {
      const self = this;
      document.body.addEventListener('mouseup', function _fun () {
        console.log('callback on removing listner!');
        self.finish(); // clear and callback
        self.canvasElement.removeEventListener('mousemove', self.scratching);
        removeEventListener('mouseup', _fun);
      });
    }
  
    removeTouchEventListner() {
      const self = this; 
      document.body.addEventListener('touchend', function _fun() {
        console.log('callback on removing listner in touch');
        self.finish(); // clear and callback
        self.canvasElement.removeEventListener('touchmove', self.scratching);
        removeEventListener('touchend', _fun);
      });
    }
  
    finish () {
      // Exec the callback once
      if (!this.callbackDone && this.percent > this.config.percentToFinish) {
        this.clearCanvas();
        this.canvasElement.style.pointerEvents = 'none';
        if (this.config.callback !== undefined) {
          this.callbackDone = true;
          this.config.callback();
        }
      }
    } 
  
    /*
    * Image data :
    * Red: image.data[0]
    * Green: image.data[1]
    * Blue: image.data[2]
    * Alpha: image.data[3]
    * */
    updatePercent (): number {
      let counter = 0; // number of pixels cleared
      let imageData = this.ctx.getImageData(0, 0, this.canvasElement.width, this.canvasElement.height);
      let imageDataLength = imageData.data.length;
  
      // loop data image drop every 4 items [r, g, b, a, ...]
      for(let i = 0; i < imageDataLength; i += 4) {
        // Increment the counter only if the pixel in completely clear
        if (imageData.data[i] === 0 && imageData.data[i+1] === 0 && imageData.data[i+2] === 0 && imageData.data[i+3] === 0) {
          counter++;
        }
      }
  
      return (counter >= 1) ? (counter / (this.canvasElement.width * this.canvasElement.height)) * 100 : 0;
    }
  
    /**
     * Just clear the canvas
    */
    clearCanvas (): void {
      if (this.canvasElement) {
      this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
      this.percent = 100;
      }
    } 
  
    updateMousePosition (x: number, y: number) {
      this.mouseX = x;
      this.mouseY = y;
    }
  
    scratch (): void {
      let x = this.position[0];
      let y = this.position[1];
      let i = 0;
  
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.save();
  
      // Choose the good method to 'paint'
      switch (this.config.scratchType) {
        case SCRATCH_TYPE.BRUSH:
          this.brush(this.brushImage);
          break;
        case SCRATCH_TYPE.CIRCLE:
          this.circle(this.config.clearZoneRadius);
          break;
        case SCRATCH_TYPE.SPRAY:
          this.spray(this.config.clearZoneRadius, this.config.pointSize,  this.config.nPoints);
          break;
      }
  
      this.ctx.restore();
    }
  
    circle (r: number) {
      this.ctx.beginPath();
      this.ctx.arc(this.mouseX + r, this.mouseY + r, r, 0, Math.PI * 2, false);
      this.ctx.fillStyle = '#000000';
      this.ctx.fill();
      this.ctx.closePath();
    }
  
    /**
     * For spray get point position in the area to clear the canvas
     * @param {number} r
     * @returns {number[]}
     */
    clearPoint (r: number): number[] {
      let radius: number = r;
      let x: number = Math.random() * 2 * radius - radius;
      let ylim: number = Math.sqrt(radius * radius - x * x);
      let y: number = Math.random() * 2 * ylim - ylim;
      x += radius;
      y += radius;
  
      x += this.mouseX;
      y += this.mouseY; 
  
      return [x, y];
    }
  
    /**
     * Create a set of points allocated in area,
     * @param {number} area
     * @param {number} dropsSize
     * @param {number} dropsCount
     */
    spray (area: number, dropsSize: number, dropsCount: number) {
      let i = 0;
  
      for (i; i < dropsCount; i++) {
        let points = this.clearPoint(area / 2);
        this.ctx.beginPath();
        this.ctx.arc(points[0] + (area / 2), points[1] + (area / 2), dropsSize / 2, 0, Math.PI * 2, false);
        this.ctx.fillStyle = '#000000';
        this.ctx.fill();
        this.ctx.closePath();
      }
    }
  
    /**
     * Draw the brush image on canvas
     * @param {HTMLImageElement} img
     */
    brush (img: HTMLImageElement) {
      if (img === null) {
        let error = new Error( 'argument img is not a node IMG');
        console.log(error.message);
        return;
      }
      let angle = Math.atan2(this.mouseY, this.mouseX);
      this.ctx.save();
      this.ctx.translate(this.mouseX, this.mouseY);
      this.ctx.rotate(angle);
      this.ctx.drawImage(img, -(img.width / 2), -(img.height / 2));
    }
  
    resetCard() {
      // this.clearCanvas();
      console.log('Scratch Card Initilization started');
      let amount = Number(this.weightedRandom() * 0.01 * this.amount).toFixed(2);
      console.log(`Calculated amount: ${amount}`);
      if (Number(amount) < MIN_VALUE) amount = MIN_VALUE.toString();
      if (Number(amount) > MAX_VALUE) amount = MAX_VALUE.toString();
      const defaults = {
        scratchType: SCRATCH_TYPE.SPRAY,
        containerWidth: 300,
        containerHeight: 300,
        percentToFinish: 50,
        nPoints: 100,
        pointSize: 50,
        callback: () => {
            // alert('done.');
        },
        brushSrc: '',
        imageForwardSrc: 'https://masth0.github.io/ScratchCard/_nuxt/img/result.0a4b6c7.png',
        imageBackgroundSrc: 'https://masth0.github.io/ScratchCard/_nuxt/img/result.0a4b6c7.png',
        clearZoneRadius: 0,
        htmlBackground: `Wohoo! You've won ₹ ${amount}.`,
        enabledPercentUpdate: true,
        cursor: {
          cur: 'string',
          png: 'string',
          poosition: [0, 0]
        }
      };
      this.config = {...defaults};
      this.scratchType = this.config.scratchType;
      this.position = [0, 0]; // init position
      this.readyToClear = false;
      this.percent = 0;
      this.callbackDone = false;
  
      this.canvasInit();
    }
    /**
     * Get the real offset
     * @param element
     * @returns {Object} offset
     */
    getOffset (element: HTMLElement) {
      let offset = {
        left: 0,
        top: 0
      };
      let clientRect = element.getBoundingClientRect();
  
      while (element) {
        offset.top += element.offsetTop;
        offset.left += element.offsetLeft;
        element = <HTMLElement>element.offsetParent;
      }
  
      // Calculate the delta between offset values and clientRect values
      let deltaLeft = offset.left - clientRect.left;
      let deltaTop = offset.top - clientRect.top;
  
      return {
        left: (deltaLeft < 0) ? offset.left + Math.abs(deltaLeft) : offset.left - Math.abs(deltaLeft),
        top: (deltaTop < 0) ? offset.top + Math.abs(deltaTop) : offset.top - Math.abs(deltaTop)
      };
    }

    goHome() {
        this._router.navigate(['']);
    }

}
