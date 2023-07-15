import * as fs from 'fs';
import path from 'path';

function uppercase(target: any, propertyKey: string) {
  let value = target[propertyKey];

  const getter = function () {
    return value;
  };

  const setter = function (newVal: string) {
    value = newVal.toUpperCase();
  };

  Object.defineProperty(target, propertyKey, {
    get: getter,
    set: setter,
    enumerable: true,
    configurable: true,
  });
}

const _global: any = global

_global.shouldDocument = false;

const options: Record<string, any> = {}


const Doc = {
  String({ example }: { example: "Chike" }) {
    return (target: any, propertyKey: string) => {
      const FIELD_TYPE = 'string';
      let value = target[propertyKey];
  
      if (_global.shouldDocument) {
        options[propertyKey] = {
          type: FIELD_TYPE,
          example
        }
      }
    
      const getter = function () {
        return value;
      };
    
      const setter = function (newVal: string) {
        value = newVal;
      };
    
      Object.defineProperty(target, propertyKey, {
        get: getter,
        set: setter,
        enumerable: true,
        configurable: true,
      });
    }
  }  
}

class Person {
  @uppercase
  name: string;


  @Doc.String({ example: "Chike" })
  field: string

  constructor(name: string) {
    this.name = name;
  }
}

console.log(">>>> ", options);

const person = new Person("John");
person.name = "Alice";
console.log(person.name); // Output: "JOHN"
console.log(options); // Output: "JOHN"


function formatMessage(strings: TemplateStringsArray, ...values: any[]): string {
  // Process the template string parts and values
  console.log(strings, values);
  
  let result = "";
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      result += values[i];
    }
  }
  return result;
}

const name = "John";
const age = 25;

// Using the template string function
const greeting = formatMessage`Hello, my name is ${name} and I am ${age} years old.`;
console.log(greeting);

const processor = (strings: TemplateStringsArray, values: any[]) => {
  let result = "";
  console.log(strings, values);
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      result += values[i];
    }
  }
  return result;
}

function html(strings: TemplateStringsArray, ...values: any[]) {
  return {
    contentType: "html",
    data: processor(strings, values)
  }
}

const f = fs.readFileSync(path.join(__dirname, './tf.m')).toString();
console.log(f);
const test = {
  "red": "red",
  "green": "green",
}
console.log((test as any)["blue"] && (test as any)["blue"]["red"])


class R {
  m = "Ok"
  static f() {
    return new this()
  }
}

console.log(R.f());
