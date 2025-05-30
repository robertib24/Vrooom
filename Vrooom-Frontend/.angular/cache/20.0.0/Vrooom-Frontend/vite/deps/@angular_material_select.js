import {
  MAT_SELECT_CONFIG,
  MAT_SELECT_SCROLL_STRATEGY,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY,
  MAT_SELECT_TRIGGER,
  MatSelect,
  MatSelectChange,
  MatSelectModule,
  MatSelectTrigger
} from "./chunk-SNND4ZPM.js";
import "./chunk-6CJNYKVZ.js";
import "./chunk-ACFAC7PG.js";
import {
  MatOptgroup,
  MatOption
} from "./chunk-7TRT5ARE.js";
import "./chunk-SI6WP7VQ.js";
import "./chunk-S5DWF6WM.js";
import "./chunk-RMBIRKNP.js";
import "./chunk-QDANDGWP.js";
import {
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatPrefix,
  MatSuffix
} from "./chunk-GGJODSEF.js";
import "./chunk-STWNHSBY.js";
import "./chunk-JKRSZR5T.js";
import "./chunk-L33NSFGK.js";
import "./chunk-6WCDMJTS.js";
import "./chunk-ZZHATRMG.js";
import "./chunk-NIMFSBGL.js";
import "./chunk-ULXWSKYX.js";
import "./chunk-VP464QCY.js";
import "./chunk-QCETVJKM.js";
import "./chunk-DQ7OVFPD.js";
import "./chunk-EOFW2REK.js";
import "./chunk-ZZ6GHQCH.js";
import "./chunk-F3P6TQRD.js";
import "./chunk-EFXQAEHX.js";
import "./chunk-3AVYBVCW.js";
import "./chunk-OKNFKRGW.js";
import "./chunk-LQCLD3XB.js";
import "./chunk-PSX7AJZG.js";
import "./chunk-AGQYHIJG.js";
import "./chunk-TZCWMU4D.js";
import "./chunk-YVXMBCE5.js";
import "./chunk-G6ECYYJH.js";
import "./chunk-RTGP7ALM.js";
import "./chunk-WDMUDEB6.js";

// node_modules/@angular/material/fesm2022/select.mjs
var matSelectAnimations = {
  // Represents
  // trigger('transformPanel', [
  //   state(
  //     'void',
  //     style({
  //       opacity: 0,
  //       transform: 'scale(1, 0.8)',
  //     }),
  //   ),
  //   transition(
  //     'void => showing',
  //     animate(
  //       '120ms cubic-bezier(0, 0, 0.2, 1)',
  //       style({
  //         opacity: 1,
  //         transform: 'scale(1, 1)',
  //       }),
  //     ),
  //   ),
  //   transition('* => void', animate('100ms linear', style({opacity: 0}))),
  // ])
  /** This animation transforms the select's overlay panel on and off the page. */
  transformPanel: {
    type: 7,
    name: "transformPanel",
    definitions: [
      {
        type: 0,
        name: "void",
        styles: {
          type: 6,
          styles: { opacity: 0, transform: "scale(1, 0.8)" },
          offset: null
        }
      },
      {
        type: 1,
        expr: "void => showing",
        animation: {
          type: 4,
          styles: {
            type: 6,
            styles: { opacity: 1, transform: "scale(1, 1)" },
            offset: null
          },
          timings: "120ms cubic-bezier(0, 0, 0.2, 1)"
        },
        options: null
      },
      {
        type: 1,
        expr: "* => void",
        animation: {
          type: 4,
          styles: { type: 6, styles: { opacity: 0 }, offset: null },
          timings: "100ms linear"
        },
        options: null
      }
    ],
    options: {}
  }
};
export {
  MAT_SELECT_CONFIG,
  MAT_SELECT_SCROLL_STRATEGY,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY,
  MAT_SELECT_TRIGGER,
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatOptgroup,
  MatOption,
  MatPrefix,
  MatSelect,
  MatSelectChange,
  MatSelectModule,
  MatSelectTrigger,
  MatSuffix,
  matSelectAnimations
};
//# sourceMappingURL=@angular_material_select.js.map
