import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;

import java.time.Duration;

public class LoginPage {
    @FindBy(id = "email")
    WebElement emailInput;
    
    @FindBy(id = "psw-1234")
    WebElement passwordInput;
    
    @FindBy(id = "lgn-btn")
    WebElement loginButton;
    
    private WebDriver driver;

    public LoginPage(WebDriver driver) {
        this.driver = driver;
        PageFactory.initElements(driver, this);
    }

    public void navigateToLoginPage() {
        driver.get("https://melkmeshi.github.io/miu/login.html");
        // Add wait for page load if needed
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        wait.until(ExpectedConditions.visibilityOf(emailInput));
    }
    
    public void enterUsername(String username) {
        emailInput.clear();
        emailInput.sendKeys(username);
    }
    
    public void enterPassword(String password) {
        passwordInput.clear();
        passwordInput.sendKeys(password);
    }
    
    public void clickLoginButton() {
        loginButton.click();
    }
    
    public void verifyDashboardVisible() {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        // Assuming there's a dashboard element with id="dashboard"
        WebElement dashboard = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("dashboard")));
        Assert.assertTrue(dashboard.isDisplayed(), "Dashboard is not visible after login");
    }
}